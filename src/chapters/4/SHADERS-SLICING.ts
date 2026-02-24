import { DRACOLoader, GLTFLoader, HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/15/vertex.glsl?raw';
import fragmentShader from './shaders/15/fragment.glsl?raw';
import { DEGREE_10, DEGREE_45, DEGREE_90 } from '../../constants/ANGLES';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gui = new GUI();

    const hdrLoader = new HDRLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/workers/draco/')
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-10, 6, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })
    );
    plane.receiveShadow = true;
    plane.position.set(1, -2, -3);
    plane.rotateY(-DEGREE_45);
    plane.rotateX(-DEGREE_45);
    scene.add(plane);

    const gears = (await gltfLoader.loadAsync('/assets/3d-models/Gear/gears.glb')).scene;
    const metallicMaterial = new CustomShaderMaterial(
        {
            baseMaterial: THREE.MeshPhysicalMaterial,
            // MeshPhysicalMaterial
            metalness: 0.7,
            roughness: 0.3,
        }
    );

    const uniforms = {
        u_sliceAngleStart: new THREE.Uniform(DEGREE_90),
        u_arcAngle: new THREE.Uniform(DEGREE_10 * 4), //40deg
    }
    gui.add(uniforms.u_sliceAngleStart, 'value', -Math.PI, Math.PI, 0.01).name('slice start angle')
    gui.add(uniforms.u_arcAngle, 'value', 0, Math.PI * 2, 0.01).name('slice angle')
    //the patch map allows us to inject code in the basic material shader
    //this time it's needed to highlight the slicing borders, we can't do it
    //in the frag shader we have because the presence of csm_FragColor
    //would totally overwrite gl_FragColor and we would lose the pbr props
    const patchMap = {
        csm_Slice:
        {
            '#include <colorspace_fragment>': `
                #include <colorspace_fragment>

                if(!gl_FrontFacing)
                    gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
            `
        }
    };
    const slicingDepthMaterial = new CustomShaderMaterial({
        baseMaterial: THREE.MeshDepthMaterial,
        vertexShader,
        fragmentShader,
        uniforms,
        depthPacking: THREE.RGBADepthPacking
    })
    const slicingMaterial = new CustomShaderMaterial(
        {
            baseMaterial: THREE.MeshPhysicalMaterial,
            vertexShader,
            fragmentShader,
            patchMap,
            side: THREE.DoubleSide,
            // MeshPhysicalMaterial
            metalness: 0.7,
            roughness: 0.3,
            uniforms,
            // MeshDepthMaterial
        }
    );
    gears.traverse(c => {
        if (c.isObject3D && (c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.name === 'outerHull') {
                (c as THREE.Mesh).material = slicingMaterial;
                c.customDepthMaterial = slicingDepthMaterial;
            }
            else
                (c as THREE.Mesh).material = metallicMaterial;

        }
    })
    scene.add(gears);
    gears.castShadow = true;

    //LIGHT
    const hLight = new THREE.AmbientLight('#ffffff', 0.6)
    scene.add(hLight);

    const dLight = new THREE.DirectionalLight('#ffffff', 1);
    dLight.castShadow = true;
    dLight.position.set(0, 5, 5);
    dLight.shadow.camera.far = 13;
    const cameraSize = 5;
    dLight.shadow.camera.left = -cameraSize;
    dLight.shadow.camera.right = cameraSize;
    dLight.shadow.camera.top = cameraSize;
    dLight.shadow.camera.bottom = -cameraSize;
    dLight.shadow.bias = -0.0001;
    dLight.shadow.normalBias = 0.01;
    dLight.shadow.mapSize.set(512, 512);
    dLight.target = plane;
    scene.add(dLight);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    const envMap = await hdrLoader.loadAsync('/assets/textures/environmentMap/aerodynamics_workshop.hdr')
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;
    scene.environmentIntensity = 0.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 1;
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    //NOTE: function to handle animations
    const runAnimations = (_: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const fps = 60;
    let lastRenderTime = 0;
    const timer = new THREE.Timer();
    const timeBetweenFrames = 1000 / fps;
    const animate = () => {
        timer.update();
        controls.update();
        const currentTime = timer.getElapsed() * 1000;

        const timeSinceLastRender = currentTime - lastRenderTime;

        if (timeSinceLastRender >= timeBetweenFrames) {
            const deltaTime = timeSinceLastRender / 1000
            lastRenderTime = currentTime;

            runAnimations(deltaTime);

            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }

    animate();

    //UTILS
    let isFullscreenOn = false;
    const toggleFullScreen = () => {
        if (isFullscreenOn)
            sceneHtmlCanvas.requestFullscreen();
        else
            document.exitFullscreen();

        isFullscreenOn = !isFullscreenOn;
    }
    sceneHtmlCanvas.addEventListener('dblclick', toggleFullScreen);
} else {
    alert("MANCA IL WRAPPER PER LA SCENA");
}
