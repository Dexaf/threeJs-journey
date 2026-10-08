import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './holo/vertex.glsl?raw';
import fragmentShader from './holo/fragment.glsl?raw';
import Stats from "stats.js";

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 3, -6);
    scene.add(camera);

    //SECTION - MESH 
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/other/sm_planetwhat_lod0.gltf")

    const mixer = new THREE.AnimationMixer(gltf.scene);
    // Play all animations or specific clips
    gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
    });

    //HOLOGRAM MATERIAL
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
        u_stripesSpeedRatio: new THREE.Uniform(0.2),
        u_stripesNumber: new THREE.Uniform(4),
        u_fresnelIntensity: new THREE.Uniform(2),
        u_glitchStrength: new THREE.Uniform(0.025),
        u_glitchSpeed: new THREE.Uniform(1.5),
    };
    const hologramMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        uniforms: uniforms,
        side: THREE.DoubleSide,
        //with transparency on and double side we need to 
        //stop the front side to occlude the backside 
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    //ATLAS MATERIAL
    const textureLoader = new THREE.TextureLoader();
    const atlasMap = await textureLoader.loadAsync("/assets/textures/atlas.jpg")
    atlasMap.colorSpace = THREE.SRGBColorSpace;
    atlasMap.flipY = false;
    atlasMap.wrapS = THREE.RepeatWrapping;
    atlasMap.wrapT = THREE.RepeatWrapping;

    const atlasMaterial = new THREE.MeshPhongMaterial({ map: atlasMap, });
    atlasMaterial.side = THREE.DoubleSide;
    atlasMaterial.shininess = 100;

    const coreMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, color: new THREE.Color('#f5ffc6') });

    gltf.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
            switch (obj.material.name) {
                case "m_ologramma":
                    obj.material = hologramMaterial;
                    break;
                case "m_core":
                    obj.material = coreMaterial;
                    break;
                case "m_atlas":
                    obj.material = atlasMaterial;
                    break;
                default:
                    break;
            }
            obj.material.needsUpdate = true;
        }
    })

    const obj = gltf.scene;

    scene.add(obj);
    //!SECTION - MESH 

    const light = new THREE.DirectionalLight('white', 3);
    light.position.set(-5, 10, 3);
    scene.add(light)
    const aLight = new THREE.AmbientLight('white', 1);
    scene.add(aLight)

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
        antialias: true
    })
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
    const runLogic = (deltaTime: number) => {
        uniforms.u_time.value += deltaTime;
    }

    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        // Update mixer with delta time
        if (mixer) mixer.update(deltaTime);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const timer = new THREE.Timer();
    const stats = new Stats();
    const animate = () => {
        stats.begin();
        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();
        runLogic(deltaTime);
        runAnimations(deltaTime);

        renderer.render(scene, camera);

        stats.end();
        console.info(
            'calls', renderer.info.render.calls,
            'triangles', renderer.info.render.triangles,
            'geometries', renderer.info.memory.geometries,
            'textures', renderer.info.memory.textures
        )
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
