import './style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //il loading manager gestisce in modo generico i caricamenti delle varie texture
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onStart = () => {
        console.log('start loading...');
    }
    loadingManager.onProgress = (url, _, __) => {
        console.log('loading', url, 'in progress...');
    }
    loadingManager.onError = (url) => {
        console.log('error for', url);
    }
    loadingManager.onLoad = () => {
        console.log('loaded!');
    }

    //oggetto per caricare le texture
    const textureLoader = new THREE.TextureLoader(loadingManager);

    //carichiamo la texture e inscriviamo la codifica dei colori
    const albedo = textureLoader.load("/assets/textures/door/albedo.jpg");
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.x = 5;
    albedo.repeat.y = 3;

    //nearest filter fa si che non abbiamo bisogno delle mimaps
    albedo.minFilter = THREE.NearestFilter;
    albedo.generateMipmaps = false;
    albedo.magFilter = THREE.NearestFilter;

    const alpha = textureLoader.load("/assets/textures/door/alpha.jpg");
    // const heightMap = textureLoader.load("/assets/textures/door/height-map.jpg");
    // const metalness = textureLoader.load("/assets/textures/door/metalness.jpg");
    // const normal = textureLoader.load("/assets/textures/door/normal.jpg");
    // const occlusion = textureLoader.load("/assets/textures/door/occlusion.jpg");
    // const roughness = textureLoader.load("/assets/textures/door/roughness.jpg");

    //SCENE
    const scene = new THREE.Scene();

    //GEOMETRY - FORMA
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    //MATERIAL - ASPETTO
    const material = new THREE.MeshBasicMaterial({ map: albedo, alphaMap: alpha });
    //MESH     - 3D OBJECT
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

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
    camera.position.set(-3, 0, 0);
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

    //RENDERING
    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        mesh.rotateY((15 * (Math.PI / 180)) * deltaTime)
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
