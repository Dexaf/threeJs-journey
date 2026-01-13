import './style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;
if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight)
    renderer.render(scene, camera);
} else {
    alert("MANCA IL WRAPPER PER LA SCENA");
}
