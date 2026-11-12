import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { color, instancedMesh, pass } from 'three/tsl';
import { WebGPURenderer, RenderPipeline } from 'three/webgpu';
import '../../style.css'
import * as THREE from 'three'
import { createSunLayer } from './create-sun-layer';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { createBrightSunMaterial } from './create-bright-sun-material';


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
    camera.near = 0.1;
    camera.far = 50;
    //serve per aggiornare la proj matrix usata negli shader
    camera.updateProjectionMatrix();
    camera.position.set(0, 2, 10);
    scene.add(camera);

    //RENDERER
    const renderer = new WebGPURenderer({
        canvas: sceneHtmlCanvas,
        antialias: true
    })
    await renderer.init();
    renderer.setClearColor("#000")
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);

    const renderPipeline = new RenderPipeline(renderer);
    // capture scene's rendering
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode('output');
    const bloomParams = {
        strength: 0.8,
        radius: 0.1,
        threshold: 0.1,
    };
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const bloomPass = bloom(scenePassColor,
        bloomParams.strength,
        bloomParams.radius,
        bloomParams.threshold
    );
    bloomPass.setResolutionScale(isMobile ? 0.25 : 0.5);
    const gui = new GUI();
    const bloomFolder = gui.addFolder('Bloom Settings');
    bloomFolder.add(bloomParams, 'strength', 0.0, 5.0, 0.01).onChange((value) => { bloomPass.strength.value = value; });
    bloomFolder.add(bloomParams, 'radius', 0.0, 1.0, 0.01).onChange((value) => { bloomPass.radius.value = value; });
    bloomFolder.add(bloomParams, 'threshold', 0.0, 1.0, 0.01).onChange((value) => { bloomPass.threshold.value = value; });
    bloomFolder.open();

    //replace output with changed scene output    
    renderPipeline.outputNode = scenePassColor.add(bloomPass);

    //SECTION - MESH 
    const gltfLoader = new GLTFLoader();
    const saataHeadGltf = await gltfLoader.loadAsync("./saata.gltf");
    const textureLoader = new THREE.TextureLoader();
    const noiseTexture = await textureLoader.loadAsync("/assets/textures/noise/noise-p2.png");
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    const externalColor = color("#1c9dff");
    const layerExternal = createSunLayer(saataHeadGltf.scene.clone(true), 1, externalColor, noiseTexture, 0.1);
    layerExternal.renderOrder = 1;

    const internalColor = color("#4bb1ff");
    const layerInternal = createSunLayer(saataHeadGltf.scene.clone(true), 0.7, internalColor, noiseTexture, 0.75);
    layerInternal.position.add(new THREE.Vector3(0, 0.1, 0));
    layerInternal.renderOrder = 2;

    const coreColor = color("#c5e6ff");
    const layerCore = createSunLayer(saataHeadGltf.scene.clone(true), 0.55, coreColor, noiseTexture, 1);
    layerCore.position.add(new THREE.Vector3(0, 0.2, 0));
    layerCore.renderOrder = 3;

    const sun = new THREE.Group();
    sun.add(layerExternal, layerInternal, layerCore);
    // sun.add(instances);

    scene.add(sun);
    //!SECTION - MESH 

    const dLight = new THREE.DirectionalLight('white', 2);
    dLight.position.set(-2, 1, -1.5)
    scene.add(dLight)
    const aLight = new THREE.AmbientLight('white', 1.5);
    scene.add(aLight)

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })
    //RENDERING
    const runLogic = (deltaTime: number) => {
    }

    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const timer = new THREE.Timer();
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const animate = () => {
        stats.begin();
        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();
        runLogic(deltaTime);
        runAnimations(deltaTime);

        // renderer.render(scene, camera);
        renderPipeline.render();

        stats.end();
        console.info(
            'calls', renderer.info.render.drawCalls,
            'triangles', renderer.info.render.triangles,
            'geometries', renderer.info.memory.geometries,
            'textures', renderer.info.memory.textures
        )
        requestAnimationFrame(animate);
    }
    renderer.init().then(() => animate());

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
