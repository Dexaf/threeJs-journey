import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import type { Mesh } from 'three';
import vertexShader from './vertex.glsl?raw';
import fragmentShader from './fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
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
    const gltfLoader = new GLTFLoader();
    const curve = await gltfLoader.loadAsync('/assets/3d-models/Globe/Globe.glb');
    const uniforms = {
        u_tailProgress: new THREE.Uniform(0),
        u_headProgress: new THREE.Uniform(0)
    }
    curve.scene.traverse(m => {
        (m as Mesh).material = new THREE.RawShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms,
            transparent: true
        })
    })
    scene.add(curve.scene)

    //LIGHT
    const aLight = new THREE.DirectionalLight('#ffffff', 10);
    scene.add(aLight);

    //GUI
    const gui = new GUI();
    gui.add(uniforms.u_tailProgress, 'value', 0, 1, 0.01).name('tail progress');
    gui.add(uniforms.u_headProgress, 'value', 0, 1, 0.01).name('head progress');;

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    const tl = gsap.timeline();
    tl.to(
        { progress: 0 },
        {
            progress: 1,
            duration: 3,
            ease: 'sine.inOut',
            onUpdate() {
                const t = this.targets()[0].progress;
                uniforms.u_headProgress.value = t
            },
        },
        "head"
    );

    tl.to(
        { progress: 0 },
        {
            progress: 1,
            duration: 3,
            ease: 'sine.inOut',
            onUpdate() {
                const t = this.targets()[0].progress;
                uniforms.u_tailProgress.value = t
            },
            onComplete() {
                uniforms.u_headProgress.value = 0;
                uniforms.u_tailProgress.value = 0;
                tl.restart();
            }
        },
        "head+=1"
    )

    tl.play();

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
        antialias: true
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
    }

    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const timer = new THREE.Timer();
    const animate = () => {
        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();
        runLogic(deltaTime);
        runAnimations(deltaTime);

        renderer.render(scene, camera);
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
