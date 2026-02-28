import { HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { DEGREE_90 } from '../../constants/ANGLES';
import vertexShader from './shaders/16/vertex.glsl?raw';
import fragmentShader from './shaders/16/fragment.glsl?raw';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const gui = new GUI();

    const hdrLoader = new HDRLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-12, 12, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    //SECTION - BOARD
    //three bvh csg e' un plugin che ci consente di usare forme geometriche come "brush"
    //e costruire forme tramite operazione di addizione e sottrazione di aree
    const boardArea = new Brush(new THREE.BoxGeometry(11, 2, 11));
    const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10));

    //SECTION - ESEMPIO SPOSTAMENTO PRE USO 
    //boardHole.position.setY(0.2);
    //le interazioni usate da evaluator si basano sulle matrici dei oggetti 3d
    //queste si aggiornano solo in rendering, che qua non e' stato lanciato
    //ergo, dobbiamo aggiornarla noi manualmente 
    //boardHole.updateMatrixWorld();
    //!SECTION - ESEMPIO SPOSTAMENTO PRE USO 

    //NOTE - le forme create sono comunque mesh presenti in memoria!!!

    //evaluator esegue le operazioni tra brush
    const evaluator = new Evaluator();

    //cosi togliamo dalla boardArea la forma di boardHole, essendo quest'ultima
    //piu piccola andiamo a scavare dentro board area, essendo anche piu alta
    //creiamo un buco sopra
    const board = evaluator.evaluate(boardArea, boardHole, SUBTRACTION);
    board.castShadow = true;
    board.receiveShadow = true;

    //visto che i materiali usati per la evalute sono applicati ai vertici
    //del prodotto, ci ritroviamo con materiali non graditi, in questo caso
    //li rimuoviamo
    board.geometry.clearGroups();
    //e mettiamo il materiale che vogliamo noi
    board.material = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.3
    })
    scene.add(board);
    //!SECTION - BOARD

    //MESH 
    //SECTION - TERRAIN
    //alte suddivisioni per generare piu dettagli
    const planeGeometry = new THREE.PlaneGeometry(10, 10, 500, 500);
    //eseguiamo la rotazione sulla geometria e non sulla mesh
    //per poter lavorare usando la Y come "sopra" dentro lo shader
    planeGeometry.rotateX(-DEGREE_90);
    //le eliminiamo perche' tanto le ricalcoliamo nello shader
    planeGeometry.deleteAttribute('uv')
    planeGeometry.deleteAttribute('normal')

    const uniforms = {
        u_noiseFrequency: new THREE.Uniform(0.7),
        u_plateauFrequency: new THREE.Uniform(5.),
        u_noiseStrength: new THREE.Uniform(7.),

        // Uniformi dei colori
        u_grass: new THREE.Uniform(new THREE.Color(0.0, 0.8, 0.0)),         // #00cc00
        u_snow: new THREE.Uniform(new THREE.Color(0.9, 1.0, 0.9)),          // #e6ffe6
        u_sand: new THREE.Uniform(new THREE.Color(0.76, 0.69, 0.5)),        // #c2b08c
        u_water: new THREE.Uniform(new THREE.Color(0.0, 0.2, 0.75)),        // #0033bf
        u_waterDeep: new THREE.Uniform(new THREE.Color(0.0, 0.2, 0.85)),    // #002ca4
        u_rock: new THREE.Uniform(new THREE.Color(0.549, 0.541, 0.353)),    // #bfbd8d

    }
    gui.add(uniforms.u_noiseFrequency, 'value', 0, 10, 0.01).name('noise frequency');
    gui.add(uniforms.u_plateauFrequency, 'value', 1, 10, 1).name('plateau frequency');
    gui.add(uniforms.u_noiseStrength, 'value', 1, 10, 1).name('noise strength');

    // CSM per preservare le capacita del PBR mentre lavoriamo con roba custom
    const material = new CustomShaderMaterial({
        // CSM
        baseMaterial: THREE.MeshStandardMaterial,
        vertexShader,
        fragmentShader,
        uniforms,
        // MeshStandardMaterial
        metalness: 0,
        roughness: 0.5,
    })
    //ricalcoliamo le depth perche' stiamo alterano i vertici
    const depthMaterial = new CustomShaderMaterial(
        {
            // CSM
            baseMaterial: THREE.MeshDepthMaterial,
            vertexShader,
            uniforms,
            depthPacking: THREE.RGBADepthPacking
        }
    );
    const terrain = new THREE.Mesh(planeGeometry, material);
    terrain.customDepthMaterial = depthMaterial;
    terrain.receiveShadow = true
    terrain.castShadow = true
    scene.add(terrain);

    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10, 1, 1),
        new THREE.MeshPhysicalMaterial({
            transmission: 1,
            roughness: 0.3
        })
    )
    water.rotateX(-DEGREE_90);
    water.position.y = 0.1;
    scene.add(water)
    //!SECTION - TERRAIN

    //LIGHT
    const hLight = new THREE.AmbientLight('#ffffff', 0.6)
    scene.add(hLight);

    const dLight = new THREE.DirectionalLight('#ffffff', 2.);
    dLight.castShadow = true;
    dLight.position.set(7, 5, 5);
    dLight.shadow.camera.far = 17.5;
    const cameraSize = 7;
    dLight.shadow.camera.left = -cameraSize;
    dLight.shadow.camera.right = cameraSize;
    dLight.shadow.camera.top = cameraSize;
    dLight.shadow.camera.bottom = -cameraSize;
    dLight.shadow.bias = -0.0001;
    dLight.shadow.normalBias = 0.01;
    dLight.shadow.mapSize.set(512, 512);
    scene.add(dLight);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    const envMap = await hdrLoader.loadAsync('/assets/textures/environmentMap/spruit_sunrise.hdr')
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;
    scene.environmentIntensity = 0.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 1;
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
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
