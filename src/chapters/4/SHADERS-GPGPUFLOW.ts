import { DRACOLoader, GLTFLoader, GPUComputationRenderer, OrbitControls, type Variable as GpGpuVariable } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/13/vertex.glsl?raw';
import fragmentShader from './shaders/13/fragment.glsl?raw';
import particlesFlowShader from './shaders/13/gpGpu/particlesFlow.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { DEGREE_90 } from '../../constants/ANGLES';

// GPGPU stands for General-Purpose computing on Graphics Processing Units. 
// It’s a way of using the GPU to process data 
// rather than rendering pixels for the end-user. 
// It’s great for when you need to do the same complex calculation 
// thousands of times.

// Flow field corresponds to spatialized streams. 
// For any point in space, we calculate a direction.
// Now imagine throwing a particle on a flow field. 
// For each frame, we would calculate the stream direction for the particle 
// and make it move accordingly, resulting in the particle moving around.
// a flow field takes up a considerable amount of computing power. 
// As a result, doing the calculation for each frame for thousands and thousands of particles 
// using just the CPU wouldn’t be possible, 
// which is why we are going to use the aforementioned GPGPU.

/*
    per calcolare il flow delle particelle usiamo la GPGPU, questa struttura
    ci consente di usare un FBO (frame buffer object) come buffer di salvataggio
    dati per i calcoli della gpu che verranno poi mandati dove necessario.
    Ogni pixel nel fbo corrisponde ad una particella.
    Le texture sono rettangolari perche' la GPGPU sfrutta una scena 2D secondaria
    per calcolarle, per calcolare quindi la risoluzione di pixel che ci serve per i calcoli
    dobbiamo fare la radice quadrata del numero di pixel (9 particelle necessitano di 
    una texture 3x3, sqrt(9) => 3; se il numero non di cui fare la sqrt non e' intero
    arrotondiamo e abbiamo un po di scarto di pixel, amen)
*/

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    interface IGeometryData {
        instance: THREE.BufferGeometry,
        pointsCount: number
    }
    const geometryData: IGeometryData = {} as any;

    interface IGpGpuData {
        particlesFlowVar: GpGpuVariable;
        instance: GPUComputationRenderer,
        textureSideSize: number,
        debugMesh: THREE.Mesh
    }
    const gpGpuData: IGpGpuData = {} as any;

    interface IParticles {
        geometry: THREE.BufferGeometry,
        particlesMesh: THREE.Points
    };
    const particles: IParticles = {} as any;

    const gui = new GUI;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/workers/draco/')
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

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
    camera.position.set(-15, 0, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);
    renderer.setClearColor('#422a2a');

    //MESHES
    const gltf = await gltfLoader.loadAsync('/assets/3d-models/Ship/ship.glb');
    geometryData.instance = (gltf.scene.children[0] as THREE.Mesh).geometry;
    // const sphereGeometry = new THREE.SphereGeometry(2);
    // geometryData.instance = sphereGeometry;
    geometryData.pointsCount = geometryData.instance.attributes.position.count;

    //calc FBO width and height
    gpGpuData.textureSideSize = Math.ceil(Math.sqrt(geometryData.pointsCount));
    //creo il calcolatore per il gpGpu
    gpGpuData.instance = new GPUComputationRenderer(gpGpuData.textureSideSize, gpGpuData.textureSideSize, renderer);
    //'screenshot' dello stato attuale della texture renderizzata, per ora piena di zeri
    const initialParticlesPositionTexture = gpGpuData.instance.createTexture();
    //mettiamo la posizione attuale delle particelle nella texture della gpgpu
    for (let i = 0; i < geometryData.pointsCount; i++) {
        /*
            le posizioni degli attributi sono triplette
            ad i = 1 accediamo a 3,4,5 per le posizioni
        */
        const scaledAttributesIndex = i * 3;
        const x = geometryData.instance.attributes.position.array[scaledAttributesIndex];
        const y = geometryData.instance.attributes.position.array[scaledAttributesIndex + 1];
        const z = geometryData.instance.attributes.position.array[scaledAttributesIndex + 2];

        /*
            nella gpgpu leggiamo i pixel a quadruple (R G B A).
            ad i = 1 accediamo a 3,4,5 per le posizioni e 4,5,6,7 dentro la texture (R G B A)
        */
        const scaledTextureIndex = i * 4;
        initialParticlesPositionTexture.image.data![scaledTextureIndex] = x;        //R
        initialParticlesPositionTexture.image.data![scaledTextureIndex + 1] = y;    //G
        initialParticlesPositionTexture.image.data![scaledTextureIndex + 2] = z;    //B
        //usiamo a per decretare il tempo in movimento delle particelle
        //assegnando rnd al tempo di partenza queste si resetteranno in tempistiche diverse
        //permettendo di non aver uno snap back globale e ottenendo cosi un corpo della 
        //mesh piu "compatto e riconoscibile" 
        initialParticlesPositionTexture.image.data![scaledTextureIndex + 3] = Math.random() * 2;    //A
    }
    //nello shader associato possiamo accedere a u_particles ora, ovvero la texture di flow
    gpGpuData.particlesFlowVar = gpGpuData.instance.addVariable('u_particles', particlesFlowShader, initialParticlesPositionTexture);
    /*
        add variable crea due texture, la base (lettura) e la target (scrittura).
        la base viene usata per iniziare i lavori fatti nello shader passato, la target viene 
        scritta con i risultati.
        dopo questo lavoro pero' noi dobbiamo comunque utilizzare i dati risultato per far proseguire
        il calcolo, per fare cio' settiamo le dipendenze come qua sotto, a quel punto dopo ogni iterazione
        la texture target si scambia con la base e invertono i ruoli, questa tecnica si chiama ping-pong render 
    */
    gpGpuData.instance.setVariableDependencies(gpGpuData.particlesFlowVar, [gpGpuData.particlesFlowVar])

    const gpGpuUniforms = {
        u_time: new THREE.Uniform(0),
        u_deltaTime: new THREE.Uniform(0),
        u_flowMaxLifeTime: new THREE.Uniform(2),
        u_flowSpeedRatio: new THREE.Uniform(0.2),
        u_flowFieldInfluence: new THREE.Uniform(0.5),
        u_flowIntensity: new THREE.Uniform(0.01),
        //mandare alla gpu una texture fissa ad occupare memoria e' un po pessimo
        //mi chiedo se mandarla solo al momento di reset delle posizioni sia piu economico
        //a livello di risorse occupate.
        u_startingPositionTexture: new THREE.Uniform(initialParticlesPositionTexture),
    };
    gpGpuData.particlesFlowVar.material.uniforms = gpGpuUniforms;

    gpGpuData.instance.init(); //inizializza l'istanza con i dati passati

    gui.add(gpGpuUniforms.u_flowIntensity, 'value', 0.001, 1, 0.001).name('particles flow intensity');
    gui.add(gpGpuUniforms.u_flowMaxLifeTime, 'value', 0.01, 3, 0.01).name('particles flow max life time');
    gui.add(gpGpuUniforms.u_flowFieldInfluence, 'value', 0.01, 1, 0.01).name('particles flow influence on model');

    //DEBUG GPGPUDATA RENDER
    gpGpuData.debugMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 3),
        new THREE.MeshBasicMaterial({
            map: gpGpuData.instance.getCurrentRenderTarget(gpGpuData.particlesFlowVar).texture,
            side: THREE.DoubleSide
        }),
    )
    gpGpuData.debugMesh.position.set(0, -4, 0);
    gpGpuData.debugMesh.rotateY(-DEGREE_90);
    scene.add(gpGpuData.debugMesh);

    const uniforms = {
        u_resolution: new THREE.Uniform(sizes.resolution),
        u_size: new THREE.Uniform(0.02),
        u_flowMaxLifeTime: gpGpuUniforms.u_flowMaxLifeTime,
        u_gpGpuFlowTexture: new THREE.Uniform(initialParticlesPositionTexture as THREE.Texture),
    };
    gui.add(uniforms.u_size, 'value', 0.01, 5, 0.01).name('point size');

    //PARTICLES MESH
    const particlesMaterial = new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms,
        transparent: true,
    })

    /*
        mandiamo come uv le coordinate della texture visto che per noi sono equivalenti 
        alle posizioni delle singole particelle
        (1 particella = 1 pixel = 1 set di coordinate)
    */
    //x2 perche' le uv sono vec2
    const particlesUvArray = new Float32Array(geometryData.pointsCount * 2);
    const randomizedSizes = new Float32Array(geometryData.pointsCount);

    //ROWS
    for (let rowIndex = 0; rowIndex < gpGpuData.textureSideSize; rowIndex++) {
        //COLUMNS
        for (let colIndex = 0; colIndex < gpGpuData.textureSideSize; colIndex++) {
            const pixelIndex = rowIndex * gpGpuData.textureSideSize + colIndex;

            //0.75 ... 1.25
            randomizedSizes[pixelIndex] = Math.random() * gpGpuUniforms.u_flowMaxLifeTime.value;

            //lo 0.5 ci permette di centrarci nel pixel, senno staremmo in basso a sinistra
            const u = (colIndex + 0.5) / gpGpuData.textureSideSize;
            const v = (rowIndex + 0.5) / gpGpuData.textureSideSize;

            const uvArrayIndex = pixelIndex * 2;
            particlesUvArray[uvArrayIndex] = u;
            particlesUvArray[uvArrayIndex + 1] = v;
        }
    }

    particles.geometry = new THREE.BufferGeometry();

    particles.geometry.setAttribute('a_randomSize', new THREE.BufferAttribute(randomizedSizes, 1));

    particles.geometry.setDrawRange(0, geometryData.pointsCount);   //quanti punti disegnare
    particles.geometry.setAttribute('a_particleUv', new THREE.BufferAttribute(particlesUvArray, 2));

    //accediamo ai colori dai dati dei vertici (caricati da blender)
    particles.geometry.setAttribute('a_color', geometryData.instance.attributes.color);

    particles.particlesMesh = new THREE.Points(
        particles.geometry,
        particlesMaterial
    )
    scene.add(particles.particlesMesh);

    // const gltf = await gltfLoader.loadAsync('/assets/3d-models/Ship/ship.glb');
    // const model = gltf.scene;
    // scene.add(model);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

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

    const runLogic = (deltaTime: number) => {
        gpGpuUniforms.u_time.value = timer.getElapsed();
        gpGpuUniforms.u_deltaTime.value = deltaTime;

        //lancia gli shader delle variabili ad ogni frame
        gpGpuData.instance.compute();

        uniforms.u_gpGpuFlowTexture.value = gpGpuData.instance.getCurrentRenderTarget(gpGpuData.particlesFlowVar).texture;
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
