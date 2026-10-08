import '../../style.css'
import * as THREE from 'three'
import vertexShader from './vertex.glsl?raw';
import fragmentShader from './fragment.glsl?raw';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEGREE_90 } from '../../constants/ANGLES';

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
    camera.far = 20;
    camera.position.set(0, 0, 3.5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH 
    const uniforms = {
        u_time: new THREE.Uniform(0),
        u_camPosition: new THREE.Uniform(camera.position)
    };
    const geometry = new THREE.TorusGeometry(2, 0.02, 12, 74);
    const material = new THREE.RawShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.FrontSide,
        uniforms: uniforms,
        transparent: true,
    });
    const obj = new THREE.Mesh(geometry, material);
    obj.rotateX(-DEGREE_90);
    scene.add(obj);
    //LIGHT
    const aLight = new THREE.DirectionalLight('#ffffff', 10);
    scene.add(aLight);

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

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    const runLogic = (_: number) => {
        uniforms.u_time.value = timer.getElapsed();
        uniforms.u_camPosition.value.copy(camera.position);
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
