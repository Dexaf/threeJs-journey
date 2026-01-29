import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gltfLoader = new GLTFLoader();
    const cubeTextureLoader = new THREE.CubeTextureLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-10, 2, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH
    const helmGltf = await gltfLoader.loadAsync('/assets/3d-models/FlightHelmet/glTF/FlightHelmet.gltf');
    helmGltf.scene.position.set(0, -6, 0);
    helmGltf.scene.scale.set(12, 12, 12);
    helmGltf.scene.traverse(c => { c.castShadow = true; c.receiveShadow = true })
    scene.add(helmGltf.scene);

    //LIGHT
    const dLight = new THREE.DirectionalLight(0xffffff, 3);
    dLight.position.set(-15, 0, 0);
    dLight.target = helmGltf.scene;
    dLight.castShadow = true;
    dLight.shadow.camera.far = 25;
    dLight.shadow.camera.top = 10;
    dLight.shadow.camera.bottom = -10;
    dLight.shadow.camera.left = -10;
    dLight.shadow.camera.right = 10;
    dLight.shadow.mapSize.set(512, 512);
    dLight.shadow.bias =  -0.0001;
    dLight.shadow.normalBias =  -0.0001;
    dLight.shadow.blurSamples = 2;
    const dLightHelper = new THREE.CameraHelper(dLight.shadow.camera);
    dLight.target.updateWorldMatrix(true, true);
    scene.add(dLight, dLightHelper);

    //ENV
    const cubeTexture = await cubeTextureLoader.loadAsync([
        '/assets/textures/environmentMap/0/px.png',
        '/assets/textures/environmentMap/0/nx.png',
        '/assets/textures/environmentMap/0/py.png',
        '/assets/textures/environmentMap/0/ny.png',
        '/assets/textures/environmentMap/0/pz.png',
        '/assets/textures/environmentMap/0/nz.png',
    ]);
    scene.environment = cubeTexture;
    scene.environmentIntensity = 3;
    scene.background = cubeTexture;

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
        antialias: true
    })
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 1;
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);

    //TONE MAPPING
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2;

    //GUI
    const gui = new GUI();
    gui.add(renderer, 'toneMapping', {
        No: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmicToneMapping: THREE.ACESFilmicToneMapping
    })
    gui.add(renderer, 'toneMappingExposure', 1, 10, 0.1);

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
