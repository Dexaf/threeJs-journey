import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/5/vertex.glsl?raw';
import fragmentShader from './shaders/5/fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 5, 13);
    scene.add(camera);

    //TEXTURES
    const perlinTexture = await textureLoader.loadAsync('/assets/3d-models/Coffee/perlin.png');
    //set repetition as we have to play with moving the texture
    perlinTexture.wrapS = THREE.RepeatWrapping;
    perlinTexture.wrapT = THREE.RepeatWrapping;

    //MESH
    //SECTION - COFFEE
    const coffeeGltf = await gltfLoader.loadAsync('/assets/3d-models/Coffee/bakedModel.glb');
    scene.add(coffeeGltf.scene);
    //!SECTION - COFFEE

    //SECTION - SMOKE
    const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64)
    smokeGeometry.translate(0, 0.82, 0)
    smokeGeometry.scale(1.5, 6, 1.5)

    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_perlinNoiseTexture: new THREE.Uniform(perlinTexture),
        u_time: new THREE.Uniform(0),
        u_verticalSmokeSpeedRatio: new THREE.Uniform(0.08),
        u_windOffsetSmoke: new THREE.Uniform(0.3),
        u_smokeAlphaHardThreshold: new THREE.Uniform(0.4),
        u_smokeEdgeDistanceCutRatio: new THREE.Uniform(0.85),
    };

    const smokeMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        depthWrite: false, //avoid plane self over write
        transparent: true,
        side: THREE.DoubleSide,
    })
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
    scene.add(smoke)
    //!SECTION - SMOKE

    //SECTION - GUI
    const gui = new GUI();
    gui.add(uniforms.u_verticalSmokeSpeedRatio, 'value', 0, 2, 0.01).name('vertical smoke speed ratio');
    gui.add(uniforms.u_windOffsetSmoke, 'value', -2, 2, 0.01).name('wind smoke offset');
    gui.add(uniforms.u_smokeAlphaHardThreshold, 'value', 0, 0.99, 0.01).name('smoke texture alpha hard threshold');
    gui.add(uniforms.u_smokeEdgeDistanceCutRatio, 'value', 0, 2, 0.01).name('smoke edge distance cut ratio');
    //!SECTION - GUI

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.target = new THREE.Vector3(0, 3, 0);
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
    const runLogic = (_: number) => {
    }

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

            uniforms.u_time.value = timer.getElapsed();

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
