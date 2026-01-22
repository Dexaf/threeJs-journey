import { DRACOLoader, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { DEGREE_90 } from '../../constants/ANGLES';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //CONST
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
    camera.position.set(5, 3, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    let animationMixer: null | THREE.AnimationMixer = null;

    //MODELS
    gltfLoader.load('/assets/3d-models/Fox/glTF/Fox.gltf',
        (loadedData) => {
            const mesh = loadedData.scene.children[0];
            mesh.traverse(c => c.castShadow = true)
            mesh.scale.set(0.025, 0.025, 0.025);

            animationMixer = new THREE.AnimationMixer(mesh);
            const clip = animationMixer.clipAction(loadedData.animations[0]);
            clip.play();

            scene.add(mesh);
        },
        (progressData) => { },
        (errorData) => { console.error(errorData); }
    );

    //MESHES
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial(
            {
                roughness: 0.3,
                metalness: 0.7
            }
        )
    )
    plane.receiveShadow = true;
    scene.add(plane);
    plane.rotateX(-DEGREE_90);

    //LIGHTS
    const dLight = new THREE.DirectionalLight(0xffffff, 2);
    dLight.position.set(-2, 5, -5);
    dLight.castShadow = true;
    dLight.shadow.bias = -0.1;
    dLight.shadow.radius = 3;
    const cameraSize = 3;
    dLight.shadow.camera.left = -cameraSize;
    dLight.shadow.camera.right = cameraSize;
    dLight.shadow.camera.top = cameraSize;
    dLight.shadow.camera.bottom = -cameraSize;
    dLight.shadow.camera.far = 12;

    const aLight = new THREE.AmbientLight(0xffffcc, 2);
    scene.add(dLight, aLight);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
    })
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 3;
    // renderer.setClearColor(0xffffcc);
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

            if (animationMixer)
                animationMixer.update(deltaTime);

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
