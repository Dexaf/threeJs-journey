import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/10/vertex.glsl?raw';
import fragmentShader from './shaders/10/fragment.glsl?raw';
import atmosphereFragment from './shaders/10/atmosphere_fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { DEGREE_5 } from '../../constants/ANGLES';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const textureLoader = new THREE.TextureLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-5, 0, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //MESH
    const earthTextures = {
        day: await textureLoader.loadAsync('/assets/textures/earth/earth_day.jpg'),
        night: await textureLoader.loadAsync('/assets/textures/earth/earth_night.jpg'),
        specularClouds: await textureLoader.loadAsync('/assets/textures/earth/earth_specularClouds.jpg'),
    }

    for (let texture in earthTextures) {
        earthTextures[texture as keyof typeof earthTextures].colorSpace = THREE.SRGBColorSpace;
        //the anisotropy of a texture is a filter that allows
        //textures to be more nitid on the angles.
        //without this the texture result squashed and gets blurry on curves.
        earthTextures[texture as keyof typeof earthTextures].anisotropy = 8;
    }

    //direction of sunlight used to make day and night
    const sunPosition = new THREE.Vector3();

    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
        u_texture_day: new THREE.Uniform(earthTextures.day),
        u_texture_night: new THREE.Uniform(earthTextures.night),
        u_texture_specularClouds: new THREE.Uniform(earthTextures.specularClouds),
        u_sunPosition: new THREE.Uniform(sunPosition),
        u_atmosphere_day_color: new THREE.Uniform(new THREE.Color('#427bff').convertLinearToSRGB()),
        u_atmosphere_night_color: new THREE.Uniform(new THREE.Color('#ff1900').convertLinearToSRGB()),
    };

    const earthMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms
        }
    );

    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        earthMaterial
    );
    earth.rotateY(2.8);
    earth.rotateZ(-0.5);

    scene.add(earth);

    const atmosphereMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: vertexShader,
            fragmentShader: atmosphereFragment,
            uniforms: uniforms,
            transparent: true,
            depthWrite: false
        }
    );
    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.025, 64, 64),
        atmosphereMaterial
    );
    scene.add(atmosphere);

    //GUI   
    //SECTION - SUN
    //sphere used to convert an point in the sphere in a vector 3
    //that's the sun position
    const sunDebug = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial())
    scene.add(sunDebug);
    const sphere = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
    sphere.theta = -2.8;
    const updateSun = () => {
        sunPosition.setFromSpherical(sphere).multiplyScalar(2);
        sunDebug.position.setFromSpherical(sphere).multiplyScalar(2);
    };
    updateSun();
    //!SECTION - SUN

    const gui = new GUI();
    gui.add(sphere, 'phi', 0, Math.PI).onChange(updateSun);
    gui.add(sphere, 'theta', -Math.PI, Math.PI).onChange(updateSun);
    gui.addColor(uniforms.u_atmosphere_day_color, 'value').name('atmosphere day color');
    gui.addColor(uniforms.u_atmosphere_night_color, 'value').name('atmosphere night color');
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
    const runLogic = (_: number) => {
        uniforms.u_time.value = timer.getElapsed();
    }

    const runAnimation = (deltaTime: number) => {
        earth.rotateY(DEGREE_5 * deltaTime)
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.setClearColor('#000000');

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

            runAnimation(deltaTime);

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
