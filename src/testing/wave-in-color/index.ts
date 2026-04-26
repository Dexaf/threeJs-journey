import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './vertex.glsl?raw';
import fragmentShader from './fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Color } from 'three';
import gsap from 'gsap';

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
    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH 
    const geometry = new THREE.TorusKnotGeometry();
    geometry.computeBoundingBox();
    if (!geometry.boundingBox) throw new Error('bouding box not found');

    const geometryBB = geometry.boundingBox;
    const geometrySize = new THREE.Vector3();
    geometryBB.getSize(geometrySize);

    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: { value: 0 },
        u_progress: { value: 0 },
        u_screenSize: {
            value: new THREE.Vector2(
                sceneHtmlCanvas.clientWidth,
                sceneHtmlCanvas.clientHeight
            )
        },
        u_size: {
            value: new THREE.Vector2(
                geometrySize.x,
                geometrySize.y
            )
        },
        u_currentColor: { value: new Color('#3861ff') },
        u_targetColor: { value: new Color('#02fd91') },
    }
    const gui = new GUI();
    gui.add(uniforms.u_progress, 'value', 0, 1, 0.01);

    const tl = gsap.timeline({ paused: true });
    tl.to(uniforms.u_progress, {
        value: 1,
        ease: 'sine.inOut',
        duration: 3
    });
    const animationDuration = tl.duration();
    let animationElapsed = 0;

    const material = new THREE.RawShaderMaterial(
        {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        }
    );
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

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
    const runLogic = (deltaTime: number) => {
        uniforms.u_time.value = timer.getElapsed();
        if (animationElapsed <= animationDuration)
            animationElapsed += deltaTime;
        else {
            animationElapsed = 0;
            uniforms.u_progress.value = 0;
            const a = uniforms.u_currentColor.value;
            uniforms.u_currentColor.value = uniforms.u_targetColor.value;
            uniforms.u_targetColor.value = a;
        }
    }

    //NOTE: function to handle animations
    const runAnimations = (_: number) => {
        if (animationElapsed <= animationDuration)
            tl.time(animationElapsed);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const fps = 120;
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
