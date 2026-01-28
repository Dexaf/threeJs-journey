import { GLTFLoader, HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { DEGREE_45 } from '../../constants/ANGLES';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //UTILS
    const gltfLoader = new GLTFLoader();
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const rgbLoader = new HDRLoader();
    const textureLoader = new THREE.TextureLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 0, 25);
    camera.lookAt(scene.position);
    scene.add(camera);


    //MESHES
    const sphere1 = new THREE.Mesh(
        new THREE.SphereGeometry(2, 36, 36),
        new THREE.MeshStandardMaterial({
            metalness: 0.85,
            roughness: 0.1,
            color: 0xaaaaaa
        })
    )
    const sphere2 = new THREE.Mesh(
        new THREE.SphereGeometry(2, 36, 36),
        new THREE.MeshStandardMaterial({
            metalness: 0.4,
            roughness: 0.25,
            color: 0xaaaaaa
        })
    )

    sphere1.position.set(-3, 0, 0);
    sphere2.position.set(3, 0, 0);

    const donut = new THREE.Mesh(
        new THREE.TorusGeometry(8, 0.5),
        new THREE.MeshBasicMaterial({ color: 'red' })
    )
    donut.layers.enable(1);

    //ENV MAP
    //SECTION LDR CUBE MAP
    // const envMap = await cubeTextureLoader.loadAsync([
    //     '/assets/textures/environmentMap/0/px.png',
    //     '/assets/textures/environmentMap/0/nx.png',
    //     '/assets/textures/environmentMap/0/py.png',
    //     '/assets/textures/environmentMap/0/ny.png',
    //     '/assets/textures/environmentMap/0/pz.png',
    //     '/assets/textures/environmentMap/0/nz.png',
    // ])
    //!SECTION LDR CUBE MAP

    //HDR
    //SECTION HDR CUBE MAP
    // const envMap = await rgbLoader.loadAsync('/assets/textures/environmentMap/2k.hdr')
    //istruiamo threejs a come mostrare la map
    // envMap.mapping = THREE.EquirectangularReflectionMapping;
    //!SECTION HDR CUBE MAP

    //SECTION GROUND SKYBOX
    // const gSkyBox = new GroundedSkybox(envMap, 15, 70);
    // gSkyBox.position.y = 15;
    // scene.add(gSkyBox)
    //!SECTION GROUND SKYBOX

    const envMap = await textureLoader.loadAsync('/assets/textures/environmentMap/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg')
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = envMap;
    // scene.environment = envMap;
    scene.environmentIntensity = 3;

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType })
    scene.environment = cubeRenderTarget.texture;
    const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);

    scene.add(sphere1, sphere2, donut);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
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
    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        cubeCamera.update(renderer, scene);
        donut.rotateX(DEGREE_45 * deltaTime);
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
