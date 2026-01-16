import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { generateGalaxy } from './GALAXY-OBJECTS/galaxy';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const galaxyAngularVelocity = (Math.PI * 2) * 0.0125;
    //SCENE
    const scene = new THREE.Scene();
    const gui = new GUI();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 25, 12);
    camera.lookAt(scene.position);
    scene.add(camera);

    const parameters = {
        count: 20000,
        size: 0.02,
        radius: 6,
        branches: 5,
        spinForce: 1.25,
        scatterRatio: 1.5,
        insideColor: 0x001eff,
        outsideColor: 0x00ff04,
    };

    let galaxy: THREE.Points | null = null;
    const addGalaxy = () => {
        if (galaxy) {
            scene.remove(galaxy);
            galaxy.geometry.dispose();
            (galaxy.material as THREE.PointsMaterial).dispose();
            galaxy = null;
        }
        galaxy = generateGalaxy(parameters);
        scene.add(galaxy);
    }
    addGalaxy();

    gui.add(parameters, 'count').min(100).max(20000).step(100).onFinishChange(addGalaxy);
    gui.add(parameters, 'size').min(0.01).max(1).step(0.01).onFinishChange(addGalaxy);
    gui.add(parameters, 'radius').min(1).max(20).step(0.25).onFinishChange(addGalaxy);
    gui.add(parameters, 'branches').min(1).max(10).step(1).onFinishChange(addGalaxy);
    gui.add(parameters, 'spinForce').min(-5).max(5).step(0.05).onFinishChange(addGalaxy);
    gui.add(parameters, 'scatterRatio').min(0).max(3).step(0.01).onFinishChange(addGalaxy);
    gui.addColor(parameters, 'insideColor').onFinishChange(addGalaxy);
    gui.addColor(parameters, 'outsideColor').onFinishChange(addGalaxy);


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
    const runAnimations = (delta: number) => {
        galaxy?.rotateY(delta * galaxyAngularVelocity);
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
