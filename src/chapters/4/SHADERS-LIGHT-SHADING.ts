import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import vertexShader from './shaders/8/vertex.glsl?raw';
import fragmentShader from './shaders/8/fragment.glsl?raw';
import { DEGREE_22_5 } from '../../constants/ANGLES';

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
    camera.position.set(-10, 0, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //UNIFORMS
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_modelColor: new THREE.Uniform(new THREE.Color('#a1b4fe')),
        u_lightColor: new THREE.Uniform(new THREE.Color('#ffffd6')),
        u_pointLightDistance: new THREE.Uniform(4),
        u_time: new THREE.Uniform(0),
        u_reflectionIntensity: new THREE.Uniform(20),
    }

    //MESHES
    const material = new THREE.ShaderMaterial(
        {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
        }
    );

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 36, 36),
        material
    )
    sphere.position.set(0, 0, -2);
    const torus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.4, 128, 128),
        material
    )
    torus.position.set(0, 0, 2);

    const group = new THREE.Group();
    group.add(sphere, torus);
    scene.add(group);

    //GUI
    const gui = new GUI();
    gui.add(uniforms.u_reflectionIntensity, 'value', 1, 20, 1).name('specular intensity')
    gui.add(uniforms.u_pointLightDistance, 'value', 1, 20, 0.1).name('point light max distance')
    gui.addColor(uniforms.u_modelColor, 'value').name('model color')
    gui.addColor(uniforms.u_lightColor, 'value').name('light color')

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
    const runLogic = (_: number) => {
        uniforms.u_time.value = timer.getElapsed();
    }
    
    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        group.rotateY(DEGREE_22_5 * deltaTime);
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
