import { HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //textures
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onStart = () => console.log('start loading...');
    loadingManager.onProgress = (url, _, __) => console.log('loading', url, 'in progress...');
    loadingManager.onError = (url) => console.log('error for', url);
    loadingManager.onLoad = () => console.log('loaded!');

    const textureLoader = new THREE.TextureLoader(loadingManager);

    const albedo = textureLoader.load("/assets/textures/door/albedo.jpg");
    albedo.colorSpace = THREE.SRGBColorSpace;
    const alpha = textureLoader.load("/assets/textures/door/alpha.jpg");
    const heightMap = textureLoader.load("/assets/textures/door/height-map.jpg");
    const metalness = textureLoader.load("/assets/textures/door/metalness.jpg");
    const normal = textureLoader.load("/assets/textures/door/normal.jpg");
    const occlusion = textureLoader.load("/assets/textures/door/occlusion.jpg");
    const roughness = textureLoader.load("/assets/textures/door/roughness.jpg");
    const matcap = textureLoader.load("/assets/textures/matcaps/3.png");
    matcap.colorSpace = THREE.SRGBColorSpace;
    const gradient = textureLoader.load("/assets/textures/gradients/3.jpg");
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;

    //SCENE
    const scene = new THREE.Scene();

    //MATERIALS
    const material = new THREE.MeshPhysicalMaterial({
        map: albedo,
        alphaMap: alpha,
        transparent: true,
        normalMap: normal,
        metalnessMap: metalness,
        metalness: 1,
        roughnessMap: roughness,
        roughness: 1,
        displacementMap: heightMap,
        displacementScale: 0.1,
        aoMap: occlusion,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        sheen: 1,
        sheenRoughness: 0.25,
        sheenColor: new THREE.Color(0xffffff),
        iridescence: 1,
        iridescenceIOR: 1,
        iridescenceThicknessRange: [100, 800],
        transmission: 1,
        ior: 1.5,
        thickness: 0.5
    });

    //MESH - 3D OBJECT
    const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
    sphereMesh.position.y = 2;

    const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 64, 64), material);
    planeMesh.position.x = 2;
    planeMesh.material.side = THREE.DoubleSide; //planes are rendered only in one side
    planeMesh.rotateX(Math.PI);

    const torusMesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4), material);
    torusMesh.position.x = -2;

    //batch add
    scene.add(sphereMesh, planeMesh, torusMesh);

    //LIGHTS
    // const ambientLight = new THREE.AmbientLight('0xffffff', 1);
    // scene.add(ambientLight);
    // const pointLight = new THREE.PointLight('0xffffff', 10);
    // pointLight.position.set(0, 0, 0);
    // scene.add(pointLight);

    //ENV MAP
    const hdrLoader = new HDRLoader();
    hdrLoader.load("/assets/textures/environmentMap/2k.hdr", (envMap) => {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = envMap;
        scene.environment = envMap;
    })


    //Senza una camera non vediamo niente, ergo dobbiamo crearne una
    //adattarla al wrapper o tenerla fissa (nel aspect ratio)
    //e aggiungerla alla scena
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );

    //Tutti gli oggetti creati si trovano in posizione 0,0,0.
    //quindi al momento la telecamera non vede niente perche'
    //e' dentro il cubo creato.
    //spostiamo la camera e la giriamo (lookAt) verso il nostro cubo
    camera.position.set(0, 0, -10);
    camera.lookAt(scene.position);
    scene.add(camera);

    //Una volta finito il setup dobbiamo attivare il renderer,
    //per farlo gli passiamo il canvas sulla quale disegnera'
    //gli diciamo quanto e' grande e azioneremo il render
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

    //CONTROLS
    const orbitControls = new OrbitControls(camera, sceneHtmlCanvas);
    orbitControls.enableDamping = true;

    //RENDERING
    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        sphereMesh.rotateY(-(5 * (Math.PI / 180)) * deltaTime)
        planeMesh.rotateY((5 * (Math.PI / 180)) * deltaTime)
        torusMesh.rotateY(-(5 * (Math.PI / 180)) * deltaTime)

        sphereMesh.rotateX((5 * (Math.PI / 180)) * deltaTime)
        planeMesh.rotateX((5 * (Math.PI / 180)) * deltaTime)
        torusMesh.rotateX((5 * (Math.PI / 180)) * deltaTime)
    }

    //i dispositivi han diversi pixel ratio, variano da 1 a piu di 3
    //piu il ratio sale piu l'immagine e' nitida ma diventa anche 
    //piu pesante il ratio, inoltre oltre a 3 non e' neanche 
    //notabile la differenza, per questo possiamo usare un assegnamento 
    //come quello qua sotto per assicurarci di avere un dpr non superiore a 3
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const fps = 60;
    let lastRenderTime = 0;
    const clock = new THREE.Clock();
    const timeBetweenFrames = 1000 / fps;
    const animate = () => {
        const currentTime = clock.getElapsedTime() * 1000;

        // Calculate time since last render  
        const timeSinceLastRender = currentTime - lastRenderTime;

        if (timeSinceLastRender >= timeBetweenFrames) {
            const deltaTime = timeSinceLastRender / 1000
            lastRenderTime = currentTime;

            runAnimations(deltaTime);

            //quindi usiamo requestAnimationFrame per ottenere ad ogni 
            //frame di animazione, un iterazione di una funzione
            //cosi facendo render e' come se facesse uno stop motion
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
