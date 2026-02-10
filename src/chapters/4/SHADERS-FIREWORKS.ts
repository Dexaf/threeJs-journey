import { OrbitControls, Sky } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/7/vertex.glsl?raw';
import fragmentShader from './shaders/7/fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { cloneUniforms } from 'three/src/renderers/shaders/UniformsUtils.js';
import gsap from 'gsap'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

/**
 * 
 * @param _count 
 * @param positionsArray 
 * assign random position to all particles
*/
const assignRandomPosition = (_count: any, positionsArray: Float32Array<ArrayBuffer>) => {
    for (let i = 0; i < _count; i++) {
        const idx = i * 3;

        const theta = Math.random() * Math.PI * 2;      // 0..2π
        const phi = Math.acos(2 * Math.random() - 1);   // distribuzione uniforme da -1 a 1
        let radius = 1;
        radius *= (Math.random() / 4) + 1;

        positionsArray[idx] = (Math.sin(phi) * Math.cos(theta)) * radius;       // x
        positionsArray[idx + 1] = (Math.sin(phi) * Math.sin(theta)) * radius;   // y
        positionsArray[idx + 2] = Math.cos(phi) * radius;                       // z
    }
}

if (sceneHtmlCanvas) {
    const textureLoader = new THREE.TextureLoader();
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
        60,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //SECTION - FIREWORKS
    const textures = [
        textureLoader.load('/assets/textures/particles/1.png'),
        textureLoader.load('/assets/textures/particles/3.png'),
        textureLoader.load('/assets/textures/particles/4.png'),
        textureLoader.load('/assets/textures/particles/5.png'),
        textureLoader.load('/assets/textures/particles/8.png'),
        textureLoader.load('/assets/textures/particles/9.png'),
        textureLoader.load('/assets/textures/particles/10.png'),
        textureLoader.load('/assets/textures/particles/11.png'),
        textureLoader.load('/assets/textures/particles/12.png'),
        textureLoader.load('/assets/textures/particles/13.png'),
    ]

    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
        u_progress: new THREE.Uniform(0),
        u_size: new THREE.Uniform(0.3),
        u_maxExplosionSize: new THREE.Uniform(1),
        //attributes
        a_count: new THREE.Uniform(100),    //not used in uniforms
    };

    const createFireworks = () => {
        const textureIndex = Math.round(Math.random() * (textures.length - 1));
        const usedTexture = textures[textureIndex];
        usedTexture.flipY = false;
        const _count = uniforms.a_count.value;

        //SECTION - GEOMETRY
        //num of particles X 3 dimensions 
        const positionsArray = new Float32Array(_count * 3);
        //give random position in a -0.5 0.5 range
        assignRandomPosition(_count, positionsArray);
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3))
        //!SECTION - GEOMETRY

        //SECTION - SIZES
        const sizesArrayMultiplier = new Float32Array(_count);
        for (let i = 0; i < _count; i++) {
            sizesArrayMultiplier[i] = (Math.random() * 2) + 0.1;
        }
        geometry.setAttribute('a_sizeMultiplier', new THREE.Float32BufferAttribute(sizesArrayMultiplier, 1))
        //!SECTION - SIZES

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                ...cloneUniforms(uniforms),
                //passed as a ref to make shader have real time
                //resolution value to make it scale with height
                u_resolution: new THREE.Uniform(sizes.resolution),
                u_texture: new THREE.Uniform(usedTexture),
                u_color: new THREE.Uniform(new THREE.Color(Math.random(), Math.random(), Math.random())),
            },
        });

        // Points
        const firework = new THREE.Points(geometry, material);
        firework.position.x += (Math.random() - 0.5) * 8;
        firework.position.z += (Math.random() - 0.5) * 2;
        firework.position.y += (Math.random() - 0.2) * 2;
        scene.add(firework)

        const destroy = () => {
            scene.remove(firework);
            material.dispose();
            geometry.dispose();
        }

        // Animate
        gsap.to(
            material.uniforms.u_progress,
            { value: 1, duration: 3, ease: 'linear', onComplete: destroy },
        )
    }

    //create fireworks every click of the screen
    sceneHtmlCanvas.addEventListener('click', (e) => {
        createFireworks();
    })
    //!SECTION - FIREWORKS

    //GUI
    const gui = new GUI;
    gui.add(uniforms.u_maxExplosionSize, 'value', 2, 5, 0.1).name('max explosion size');
    gui.add(uniforms.a_count, 'value', 50, 200, 5).name('particles count');
    gui.add(uniforms.u_size, 'value', 1, 50, 0.1).name('particles size');

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    sizes.resolution.x = sceneHtmlCanvas.clientWidth * renderer.getPixelRatio();
    sizes.resolution.y = sceneHtmlCanvas.clientHeight * renderer.getPixelRatio();

    //SECTION - SKY
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    const sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 10,
        rayleigh: 4,
        mieCoefficient: 0.07,
        mieDirectionalG: 0.9,
        elevation: -2,
        azimuth: 125,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera);

    }

    gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
    gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
    gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
    gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
    gui.add(effectController, 'elevation', -90, 90, 0.1).onChange(guiChanged);
    gui.add(effectController, 'azimuth', - 180, 180, 0.1).onChange(guiChanged);
    gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

    guiChanged();
    //!SECTION - SKY

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
