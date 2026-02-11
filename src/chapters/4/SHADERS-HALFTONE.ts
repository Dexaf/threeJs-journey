import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/9/vertex.glsl?raw';
import fragmentShader from './shaders/9/fragment.glsl?raw';
import { DEGREE_22_5 } from '../../constants/ANGLES';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
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
    camera.position.set(-10, 0, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //UNIFORMS
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        clearColor: { value: new THREE.Color("#8192ff").convertLinearToSRGB() },
        u_lightColor: { value: new THREE.Color("#fffdd2").convertLinearToSRGB() },
        u_objectColor: { value: new THREE.Color("#2575ff").convertLinearToSRGB() },
        u_pointColor: { value: new THREE.Color("#25c8ff").convertLinearToSRGB() },
        u_resolution: new THREE.Uniform(sizes.resolution),
        u_gridDensity: new THREE.Uniform(130),
        u_gridDotRadiusRatio: new THREE.Uniform(0.75),
    };
    const gui = new GUI();
    gui.addColor(uniforms.clearColor, 'value').name('clear color').onChange((value) => {
        renderer.setClearColor(new THREE.Color(value));
    });
    gui.addColor(uniforms.u_lightColor, 'value').name('light color');
    gui.addColor(uniforms.u_objectColor, 'value').name('model color');
    gui.addColor(uniforms.u_pointColor, 'value').name('point color');
    gui.add(uniforms.u_gridDensity, 'value', 1, 200, 1).name('grid density');
    gui.add(uniforms.u_gridDotRadiusRatio, 'value', 0, 2, 0.01).name('grid dot radius ratio');

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

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(uniforms.clearColor.value);
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
    const runLogic = (_: number) => {
        //uniforms.u_time.value = timer.getElapsed();
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
