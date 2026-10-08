import '../../style.css'
import * as THREE from 'three'
import vertexShader from './vertex.glsl?raw';
import fragmentShader from './fragment.glsl?raw';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEGREE_90 } from '../../constants/ANGLES';
import { createStarsParticles, starsUniforms } from './create-stars';
import { degToRad } from 'three/src/math/MathUtils.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        30,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.far = 100;
    camera.position.set(0, 10, -10);
    scene.add(camera);

    //MESH 
    const textureLoader = new THREE.TextureLoader();
    const txt = textureLoader.load('/assets/textures/noise/noise-p.png')
    txt.wrapS = THREE.RepeatWrapping;
    txt.wrapT = THREE.RepeatWrapping;
    const galaxyUniforms = {
        u_time: new THREE.Uniform(0),
        u_camPosition: new THREE.Uniform(camera.position),
        u_noiseTxt: new THREE.Uniform(txt),
    };

    const RESOLUTION_RATE = 10;
    const resolution = Math.pow(2, RESOLUTION_RATE);
    const geometry = new THREE.PlaneGeometry(10, 10, resolution, resolution);
    const material = new THREE.RawShaderMaterial({
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        uniforms: galaxyUniforms,
        depthTest: false,
        depthWrite: false,
        transparent: true,
    });
    const obj = new THREE.Mesh(geometry, material);
    obj.rotateX(-DEGREE_90);
    obj.renderOrder = 1;
    scene.add(obj);

    //STARS
    const starsParticles = createStarsParticles();
    starsParticles.renderOrder = 2;
    scene.add(starsParticles);

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
    renderer.setClearColor("#35155a");
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    const runLogic = (_: number) => {
        const timeElapsed = timer.getElapsed();
        galaxyUniforms.u_time.value = timeElapsed;
        galaxyUniforms.u_camPosition.value.copy(camera.position);

        starsUniforms.u_time.value = timeElapsed;
        starsParticles.rotateY(degToRad(-0.025));
    }

    //NOTE: function to handle animations
    const runAnimations = (_: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const timer = new THREE.Timer();
    const stats = new Stats()
    stats.showPanel(2);
    document.body.appendChild(stats.dom)
    const animate = () => {
        stats.begin()

        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();

        runLogic(deltaTime);
        runAnimations(deltaTime);

        renderer.render(scene, camera);

        stats.end()

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
