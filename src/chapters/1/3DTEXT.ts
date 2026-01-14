import { FontLoader, OrbitControls, TextGeometry } from 'three/examples/jsm/Addons.js';
import './style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //TEXTURE
    const material = new THREE.MeshNormalMaterial();

    //FONT
    const fontLoader = new FontLoader();
    fontLoader.load(
        '/assets/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const textGeometry = new TextGeometry(
                'Sagitauros Studio',
                {
                    font: font,
                    size: 0.5,
                    curveSegments: 12,
                    depth: 0.1,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.02,
                    bevelOffset: 0,
                    bevelSegments: 5,
                }
            )

            //il centro iniziale della geometria e' in basso a sinistra.
            //calcolando le bounding box e translando la geometria 
            //possiamo centrare il tutto
            // textGeometry.computeBoundingBox();
            // textGeometry.translate(
            //     - textGeometry.boundingBox!.max.x * 0.5,
            //     - textGeometry.boundingBox!.max.y * 0.5,
            //     - textGeometry.boundingBox!.max.z * 0.5,
            // )
            //oppure lo centriamo con una funzione...
            textGeometry.center();

            //MATERIAL - ASPETTO
            //MESH     - 3D OBJECT
            const mesh = new THREE.Mesh(textGeometry, material);
            scene.add(mesh);
        }
    );

    const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const group = new THREE.Group();
    for (let i = 0; i < 200; i++) {
        const box = new THREE.Mesh(boxGeometry, material);

        box.rotateX(Math.PI * Math.random())
        box.rotateY(Math.PI * Math.random())
        box.rotateZ(Math.PI * Math.random())

        const newScale = box.scale.x * Math.random() * 2;
        console.log(newScale)
        box.scale.set(newScale, newScale, newScale);

        box.position.set(
            ((Math.random() - 0.5) * 10),
            ((Math.random() - 0.5) * 10),
            ((Math.random() - 0.5) * 10),
        )

        group.add(box);
    }
    scene.add(group);

    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );

    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

    //CONTROLS
    const orbitControls = new OrbitControls(camera, sceneHtmlCanvas);
    orbitControls.enableDamping = true;

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
        group.rotateY((Math.PI * 0.01) * deltaTime)
        group.rotateX((Math.PI * 0.02) * deltaTime)
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
