import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { DEGREE_90 } from '../../constants/ANGLES';
import vertexShader from './shaders/3/vertex.glsl?raw';
import fragmentShader from './shaders/3/fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gui = new GUI();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(2, 1, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH 
    const resolution = Math.pow(2, 10);
    const geometry = new THREE.PlaneGeometry(2, 2, resolution, resolution);

    const gCount = geometry.attributes.position.count;

    const randoms = new Float32Array(gCount).map(e => e = Math.random() * 0.3)
    geometry.setAttribute('a_random', new THREE.BufferAttribute(randoms, 1));

    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: { value: 0 },

        u_waveNoiseRatio: { value: 0.05 },

        u_wavesHeightRatio: { value: 0.2 },

        u_zAxisWavesFrequencyRatio: { value: 1 },
        u_zAxisWavesSpeedRatio: { value: 1 },

        u_xAxisWavesFrequencyRatio: { value: 1 },
        u_xAxisWavesSpeedRatio: { value: 1 },

        u_shallowColor: { value: new THREE.Color().setRGB(0 / 255, 170 / 255, 255 / 255) },
        u_deepColor: { value: new THREE.Color().setRGB(0 / 255, 0 / 255, 255 / 255) },

    }
    const material = new THREE.ShaderMaterial(
        {
            side: THREE.DoubleSide,
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        }
    );

    gui.add(uniforms.u_waveNoiseRatio, 'value', 0, 2, 0.01).name('wave noise ratio');
    gui.add(uniforms.u_wavesHeightRatio, 'value', 0, 10, 0.01).name('waves height ratio');
    gui.add(uniforms.u_zAxisWavesFrequencyRatio, 'value', 0, 10, 0.01).name('hor  waves freq');
    gui.add(uniforms.u_zAxisWavesSpeedRatio, 'value', 0, 10, 0.01).name('hor  waves speed');
    gui.add(uniforms.u_xAxisWavesFrequencyRatio, 'value', 0, 10, 0.01).name('ver waves freq');
    gui.add(uniforms.u_xAxisWavesSpeedRatio, 'value', 0, 10, 0.01).name('ver waves speed');
    gui.addColor(uniforms.u_shallowColor, 'value').name('shallow color');
    gui.addColor(uniforms.u_deepColor, 'value').name('deep color');


    const plane = new THREE.Mesh(geometry, material);
    plane.rotateX(-DEGREE_90);
    scene.add(plane);
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
    renderer.setClearColor('grey');

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
