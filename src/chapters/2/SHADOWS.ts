import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    //SCENE
    const scene = new THREE.Scene();

    //LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    scene.add(directionalLight);
    directionalLight.position.set(0, 2, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.1;
    directionalLight.shadow.radius = 5;
    const cameraSize = 2.6;
    directionalLight.shadow.camera.left = -cameraSize;
    directionalLight.shadow.camera.right = cameraSize;
    directionalLight.shadow.camera.top = cameraSize;
    directionalLight.shadow.camera.bottom = -cameraSize;
    directionalLight.shadow.camera.far = 4;
    directionalLight.shadow.mapSize.set(512, 512);

    //MATERIAL - ASPETTO
    const material = new THREE.MeshStandardMaterial();
    //MESH     - 3D OBJECT
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1), material);
    const mesh1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), material);
    const mesh2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2), material);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), material);
    plane.material.side = THREE.DoubleSide;

    //shadows
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh1.castShadow = true; mesh1.receiveShadow = true;
    mesh2.castShadow = true; mesh2.receiveShadow = true;
    plane.receiveShadow = true;

    //Position
    mesh.position.set(1.7, 0, 0);
    mesh1.position.set(-1.7, 0, 0);
    mesh2.position.set(0, 0, 0);
    plane.position.set(0, -1, 0);
    plane.rotateX(-Math.PI / 2);

    scene.add(mesh, mesh1, mesh2, plane);

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );

    camera.position.set(0, 2, 6);
    camera.lookAt(scene.position);
    scene.add(camera);

    //CONTROLS
    const orbitControls = new OrbitControls(camera, sceneHtmlCanvas);
    orbitControls.enableDamping = true;

    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    renderer.render(scene, camera);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 3;

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        mesh.rotateZ((10 * (Math.PI / 180)) * deltaTime);
        mesh1.rotateZ((10 * (Math.PI / 180)) * deltaTime);
        mesh2.rotateZ((10 * (Math.PI / 180)) * deltaTime);

        mesh.rotateX((10 * (Math.PI / 180)) * deltaTime);
        mesh1.rotateX((10 * (Math.PI / 180)) * deltaTime);
        mesh2.rotateX((10 * (Math.PI / 180)) * deltaTime);
    }

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
