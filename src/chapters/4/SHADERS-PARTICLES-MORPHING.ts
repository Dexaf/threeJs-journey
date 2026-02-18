import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/12/vertex.glsl?raw';
import fragmentShader from './shaders/12/fragment.glsl?raw';
import { DEGREE_90 } from '../../constants/ANGLES';
import gsap from 'gsap';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gltfLoader = new GLTFLoader();
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const sizes = {
        width: sceneHtmlCanvas.clientWidth,
        height: sceneHtmlCanvas.clientHeight,
        resolution: new THREE.Vector2(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight)
    }
    const wrapperAspectRatio = sizes.width / sizes.height;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-5, 3, -5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //MESH
    const gltf = await gltfLoader.loadAsync('/assets/3d-models/Fox/glTF/Fox.gltf');
    const model = gltf.scene.children[0].children[0];
    const modelPointsPositions = (model as THREE.Mesh).geometry.attributes.position.array;
    const modelPointsArray = new Float32Array(modelPointsPositions.length);
    for (let i = 0; i < modelPointsArray.length; i++) {
        const modelPoint = modelPointsPositions[i] * 0.025;
        modelPointsArray[i] = modelPoint;
    }
    const modelPointsArrayAttribute = new THREE.Float32BufferAttribute(modelPointsArray, 3)

    //SPHERE POINTS
    const sphereGeometry = new THREE.SphereGeometry(1);
    const spherePointsPositions = sphereGeometry.attributes.position.array;
    const spherePointsArray = new Float32Array(modelPointsPositions.length);
    for (let i = 0; i < (modelPointsArray.length / 3); i++) {
        const steppedI = i * 3;
        if (steppedI < spherePointsPositions.length) {
            let modelPoint = spherePointsPositions[steppedI];
            spherePointsArray[steppedI] = modelPoint;
            modelPoint = spherePointsPositions[steppedI + 1];
            spherePointsArray[steppedI + 1] = modelPoint;
            modelPoint = spherePointsPositions[steppedI + 2];
            spherePointsArray[steppedI + 2] = modelPoint;
        } else {
            let rndIndex = Math.round(Math.random() * ((spherePointsPositions.length - 1) / 3));
            rndIndex *= 3;
            spherePointsArray[steppedI] = spherePointsPositions[rndIndex];
            spherePointsArray[steppedI + 1] = spherePointsPositions[rndIndex + 1];
            spherePointsArray[steppedI + 2] = spherePointsPositions[rndIndex + 2];
        }
    }
    const spherePointsArrayAttribute = new THREE.Float32BufferAttribute(spherePointsArray, 3);

    //TORUS POINTS
    const torusGeometry = new THREE.TorusGeometry();
    const torusPointsPositions = torusGeometry.attributes.position.array;
    const torusPointsArray = new Float32Array(modelPointsPositions.length);
    for (let i = 0; i < (modelPointsArray.length / 3); i++) {
        const steppedI = i * 3;
        if (steppedI < torusPointsPositions.length) {
            let modelPoint = torusPointsPositions[steppedI];
            torusPointsArray[steppedI] = modelPoint;
            modelPoint = torusPointsPositions[steppedI + 1];
            torusPointsArray[steppedI + 1] = modelPoint;
            modelPoint = torusPointsPositions[steppedI + 2];
            torusPointsArray[steppedI + 2] = modelPoint;
        } else {
            let rndIndex = Math.round(Math.random() * ((torusPointsPositions.length - 1) / 3));
            rndIndex *= 3;
            torusPointsArray[steppedI] = torusPointsPositions[rndIndex];
            torusPointsArray[steppedI + 1] = torusPointsPositions[rndIndex + 1];
            torusPointsArray[steppedI + 2] = torusPointsPositions[rndIndex + 2];
        }
    }
    const torusPointsArrayAttribute = new THREE.Float32BufferAttribute(torusPointsArray, 3);

    //GEOMETRIES
    //a bit dirty but it allows us to start from 0 in activateMorph the first time
    let currentIndex = -1;
    let targetIndex = 0;
    const geometries = [
        modelPointsArrayAttribute,
        spherePointsArrayAttribute,
        torusPointsArrayAttribute
    ]

    //GEOMETRY
    const modelGeometry = new THREE.BufferGeometry();
    modelGeometry.setAttribute('position', geometries[currentIndex]);
    modelGeometry.setAttribute('a_PositionTarget', geometries[targetIndex]);

    //SHADER
    const uniforms = {
        u_progress: new THREE.Uniform(0),
        u_resolution: new THREE.Uniform(sizes.resolution),
        u_size: new THREE.Uniform(0.2),
    };
    const shaderMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            transparent: true,
            depthWrite: false,
        }
    )
    const modelPointsMesh = new THREE.Points(modelGeometry, shaderMaterial);
    modelPointsMesh.rotateY(-DEGREE_90);
    scene.add(modelPointsMesh);
    let activateMorph = () => { };
    activateMorph = () => {
        uniforms.u_progress.value = 0;
        currentIndex++;
        currentIndex = currentIndex % geometries.length;
        targetIndex = currentIndex + 1;
        targetIndex = targetIndex % geometries.length;

        modelGeometry.setAttribute('position', geometries[currentIndex]);
        modelGeometry.setAttribute('a_PositionTarget', geometries[targetIndex]);

        gsap.to(
            uniforms.u_progress,
            {
                value: 1, duration: 3, ease: 'power2.inOut', onComplete: activateMorph
            }
        )
    }
    activateMorph();


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
        sizes.width = sceneHtmlCanvas.clientWidth;
        sizes.height = sceneHtmlCanvas.clientHeight;
        sizes.resolution.x = sceneHtmlCanvas.clientWidth * renderer.getPixelRatio();
        sizes.resolution.y = sceneHtmlCanvas.clientHeight * renderer.getPixelRatio();

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
    })

    //RENDERING
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
