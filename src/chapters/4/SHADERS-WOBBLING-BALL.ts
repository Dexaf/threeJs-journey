import { HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import vertexShader from './shaders/14/vertex.glsl?raw';
import fragmentShader from './shaders/14/fragment.glsl?raw';
import depthVertexShader from './shaders/14/depthVertex.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { DEGREE_45, DEGREE_90 } from '../../constants/ANGLES';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const hdrLoader = new HDRLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-7, -3, -3);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH
    let icosahedronGeometry = new THREE.IcosahedronGeometry(1, 64);
    //indicizza i vertici, molto pesante come calcolo 
    icosahedronGeometry = mergeVertices(icosahedronGeometry) as any;
    //genera le tangenti, cosi abbiamo normale, tangente
    icosahedronGeometry.computeTangents();

    const uniforms = {
        u_time: new THREE.Uniform(0),
        u_wobbleStrengthRatio: new THREE.Uniform(0.25),
        u_wobbleFrequency: new THREE.Uniform(1.5),
        u_wobbleSpeed: new THREE.Uniform(0.2),
    }
    const gui = new GUI();
    gui.add(uniforms.u_wobbleStrengthRatio, 'value', 0.01, 2, 0.01).name('wobble strength ratio');
    gui.add(uniforms.u_wobbleFrequency, 'value', 0.01, 2, 0.01).name('wobble frequency');
    gui.add(uniforms.u_wobbleSpeed, 'value', 0.01, 4, 0.01).name('wobble speed');

    //custom shader material ci consente di estendere i materiali 
    //base di three js con i nostri shader, e' una libreria esterna
    //quindi non sono entusiasta di cio', pero' e' molto comodo.

    //questo materiale serve per aggiornare le ombre proiettate
    //visto che modifichiamo la forma dell'oggetto 3D, le normali 
    //e la forma cambia, ergo, dobbiamo aggiornare il depth material.
    //il depth material viene usato da three js per calcolare 
    //i risultati delle ombre
    const depthMaterial = new CustomShaderMaterial({
        // CSM
        baseMaterial: THREE.MeshDepthMaterial,
        vertexShader: depthVertexShader,
        uniforms: uniforms,
        // The depthPacking is an algorithm used by Three.js 
        // to encode the depth in all 4 channels instead of a grayscale depth, 
        // which improves the precision.
        depthPacking: THREE.RGBADepthPacking
    })

    const icosahedronMaterial = new CustomShaderMaterial({
        // CSM
        baseMaterial: THREE.MeshPhysicalMaterial,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,

        // MeshPhysicalMaterial
        metalness: 0,
        roughness: 0.5,
        transmission: 0,
        ior: 1.5,
        thickness: 1.5,
        transparent: true,
        wireframe: false
    })
    const icosahedron = new THREE.Mesh(
        icosahedronGeometry,
        icosahedronMaterial
    );
    icosahedron.customDepthMaterial = depthMaterial;
    icosahedron.castShadow = true;
    scene.add(icosahedron);

    const planeGeometry = new THREE.PlaneGeometry(5, 5);
    const planeMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(
        planeGeometry,
        planeMaterial,
    )
    plane.receiveShadow = true;
    plane.rotateY(DEGREE_90);
    plane.rotateX(DEGREE_45);
    plane.position.set(2, -2, -1);
    scene.add(plane);

    //LIGHT
    const dLight = new THREE.DirectionalLight('#ffffff', 0.5);
    dLight.position.set(-2, 2, 1);
    dLight.castShadow = true;
    const dLightShadowFrustum = 2;
    dLight.shadow.camera.left = -dLightShadowFrustum;
    dLight.shadow.camera.right = dLightShadowFrustum;
    dLight.shadow.camera.top = dLightShadowFrustum;
    dLight.shadow.camera.bottom = -dLightShadowFrustum;
    dLight.shadow.camera.far = 8;
    dLight.shadow.bias = -0.01;
    dLight.shadow.radius = 3;
    scene.add(dLight);

    const aLight = new THREE.AmbientLight('#ffffff', 0.3);
    scene.add(aLight);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    const envMap = await hdrLoader.loadAsync('/assets/textures/environmentMap/2k.hdr')
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;
    scene.environmentIntensity = 0.6;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.shadowMap.enabled = true;
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    const runLogic = (_: number) => {
        uniforms.u_time.value = timer.getElapsed();
    }

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

            runLogic(deltaTime);
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
