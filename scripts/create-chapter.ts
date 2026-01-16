#!/usr/bin/env node
import fs from "fs";
import path from "path";

const [, , chapterNumber, title] = process.argv;

if (!chapterNumber || !title) {
    console.error("Uso: npm run create:chapter <numero> <titolo>");
    process.exit(1);
}

// sanitizza titolo per nome file
const safeTitle = title
    .replace(/\s+/g, "-");

const baseDir = path.resolve("src/chapters", chapterNumber);

// crea cartella se non esiste
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

// file da creare
const files = [
    `${safeTitle}.txt`,
    `${safeTitle}.html`,
    `${safeTitle}.ts`,
];

const contents = {
    txt: ``,
    html: `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>chapter {{CHA}} {{BLUEPRINT}}</title>
    </head>

    <body>
        <h1>chapter {{CHA}} {{BLUEPRINT}}</h1>
        <canvas id="three-scene-canvas">
        </canvas>
    </body>

    <script type="module" src="./{{BLUEPRINT}}.ts"></script>

    <style>
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            place-content: center;
            place-items: center;
            flex-direction: column;
            row-gap: 1rem;
        }

        #three-scene-canvas {
            width: 100% !important;
            height: 45rem !important;
        }
    </style>

</html>
    `,
    ts: `import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(scene.position);
    scene.add(camera);

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
    `,
};

contents.html = contents.html
    .replaceAll('{{CHA}}', chapterNumber)
    .replaceAll('{{BLUEPRINT}}', safeTitle);

files.forEach((file) => {
    const ext = (file.split(".").pop()) as "txt" | "html" | "ts";
    const filePath = path.join(baseDir, file);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, contents[ext!]);
    }
});

console.log(`Capitolo ${chapterNumber} creato: ${files.join(", ")}`);