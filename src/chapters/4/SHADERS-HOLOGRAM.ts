import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import vertexShader from './shaders/6/vertex.glsl?raw';
import fragmentShader from './shaders/6/fragment.glsl?raw';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gltfLoader = new GLTFLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //SECTION - MATERIAL
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
        u_stripesSpeedRatio: new THREE.Uniform(0.1),
        u_stripesNumber: new THREE.Uniform(8),
        u_fresnelIntensity: new THREE.Uniform(1.1),
        u_glitchStrength: new THREE.Uniform(0.1),
        u_glitchSpeed: new THREE.Uniform(0),
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
        blending: THREE.AdditiveBlending
    });
    //!SECTION - MATERIAL

    //SECTION - SUZANNE
    const gltf = await gltfLoader.loadAsync('/assets/3d-models/planet-what/sm_planet_what_lod0.gltf');
    (gltf.scene.children[0] as THREE.Mesh).material = hologramMaterial;

    gltf.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
            console.log(obj.material.name);
            switch (obj.material.name) {
                case "m_hologram":
                    obj.material = hologramMaterial;
                    break;
                default:
                    break;
            }
            obj.material.needsUpdate = true;
        }
    })
    scene.add(gltf.scene);
    //!SECTION - SUZANNE

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //SECTION - GUI
    const gui = new GUI();
    gui.add(uniforms.u_stripesSpeedRatio, 'value', -10, 10, 0.05).name('stripes speed ratio');
    gui.add(uniforms.u_stripesNumber, 'value', 1, 30, 1).name('stripes number');
    gui.add(uniforms.u_fresnelIntensity, 'value', 0, 5, 0.1).name('fresnel intensity');
    gui.add(uniforms.u_glitchStrength, 'value', 0, 2, 0.05).name('glitch strength');
    gui.add(uniforms.u_glitchSpeed, 'value', 0, 10, 0.1).name('glitch speed');
    //!SECTION - GUI

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);
    renderer.setClearColor(new THREE.Color('#29283b'))

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    //NOTE: function to handle animations
    const runLogic = (_: number) => {
        uniforms.u_time.value = timer.getElapsed();
    }

    const runAnimations = (deltaTime: number) => {
        // suzanneGltf.scene.rotateY(DEGREE_22_5 * deltaTime);
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
