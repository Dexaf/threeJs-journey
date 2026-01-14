import '../../style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //GEOMETRY - FORMA
    const geometry = new THREE.BoxGeometry(1);
    //MATERIAL - ASPETTO
    const material = new THREE.MeshBasicMaterial({ color: 'red', wireframe: true });
    //MESH     - 3D OBJECT
    const mesh = new THREE.Mesh(geometry, material);
    const mesh1 = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'green', wireframe: true }));
    const mesh2 = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'blue', wireframe: true }));

    //Position
    mesh.position.set(0.5, -0.5, 0);
    mesh1.position.set(-0.5, -0.5, 0);
    mesh2.position.set(0, 0.5, 0);

    /*
        le rotazioni fatte senza quaternioni sono "pericolose"
        rischiano di lockare gli assi e non muoversi piu'.
        c'e' anche la necessita di decidere l'ordine di rotazione
        per ottenere la direzione voluta (XYZ E YZX portano in una direazione finale diversa)
    */
    // Rotation
    mesh.rotation.y = 45 * (Math.PI / 180);
    mesh1.rotation.y = 45 * (Math.PI / 180);
    mesh2.rotation.y = 45 * (Math.PI / 180);

    // I gruppi sono un modo per isolare degli oggetti 3D
    // Dentro uno contenitore.
    // Gli oggetti interni ora sono locali alla transformata
    // del gruppo.
    const group = new THREE.Group();
    group.add(mesh);
    group.add(mesh1);
    group.add(mesh2);

    //Aggiungiamo l'oggetto 3d alla scena
    //scene.add(mesh);
    scene.add(group);

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
    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //HELPERS
    //three js mette a disposizione una serie di classi che creano
    //delle utility grafiche per capire cosa stiamo facendo o affini
    //in genere queste utility terminano con "Helper"
    const axes = new THREE.AxesHelper(10);
    scene.add(axes);

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
        group.rotateZ((30 * (Math.PI / 180)) * deltaTime);
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
