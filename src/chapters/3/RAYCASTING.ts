import { OrbitControls } from 'three/examples/jsm/Addons.js';
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
    camera.position.set(-10, 0, 0);
    camera.lookAt(scene.position);
    scene.add(camera);

    // MESHES
    const geometry = new THREE.SphereGeometry(1, 32, 32);

    const sphereRed = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'red' }));
    const sphereGreen = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'green' }));
    const sphereBlue = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'blue' }));

    sphereRed.name = 'sphere red';
    sphereGreen.name = 'sphere blue';
    sphereBlue.name = 'sphere green';

    sphereRed.position.set(0, 0, -2);
    sphereGreen.position.set(0, 0, 2);
    sphereBlue.position.set(0, 2, 0);

    scene.add(sphereRed, sphereGreen, sphereBlue);

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
    renderer.setClearColor(new THREE.Color('lightgrey'))

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RAYCASTER
    const raycaster = new THREE.Raycaster();
    let touchPosition: THREE.Vector2 | null = null;
    sceneHtmlCanvas.addEventListener('pointerdown', (e: PointerEvent) => {
        const halfCanvasSizeX = sceneHtmlCanvas.width / 2;
        const halfCanvasSizeY = sceneHtmlCanvas.height / 2;

        //calc the click as if the canvas was at the top of the viewport to make
        //the next calcs work
        const normalizedClickX = e.clientX - sceneHtmlCanvas.getBoundingClientRect().left;
        const normalizedClickY = e.clientY - sceneHtmlCanvas.getBoundingClientRect().top;

        //get the position of the mouse as -1 to 1 in ratio with the canvas sizes with 0 beign the middle
        const normalizedClickPosX = (normalizedClickX - (halfCanvasSizeX)) / (halfCanvasSizeX);
        const normalizedClickPosY = -(normalizedClickY - (halfCanvasSizeY)) / (halfCanvasSizeY);

        touchPosition = new THREE.Vector2(normalizedClickPosX, normalizedClickPosY);
    })

    sceneHtmlCanvas.addEventListener('pointerup', (_) => touchPosition = null)

    //RENDERING
    //NOTE: function to handle logic
    const intersectableObjects = [sphereRed, sphereGreen, sphereBlue];
    const shouldPulse = [false, false, false];

    const runLogic = (_: number) => {
        for (let i = 0; i < shouldPulse.length; i++) {
            shouldPulse[i] = false;
        }
        if (touchPosition) {
            raycaster.setFromCamera(touchPosition, camera);

            const intersections = raycaster.intersectObjects(intersectableObjects);
            for (let i = 0; i < intersections.length; i++) {
                switch (intersections[i].object.name) {
                    case "sphere red":
                        shouldPulse[0] = true;
                        break;
                    case "sphere green":
                        shouldPulse[1] = true;
                        break;
                    case "sphere blue":
                        shouldPulse[2] = true;
                        break;
                    default:
                        break;
                }
            }
        }
    }


    //NOTE: function to handle animations
    const runAnimations = (_: number) => {
        for (let i = 0; i < shouldPulse.length; i++) {
            const sp = shouldPulse[i];
            let scale = 1 + ((Math.sin(timer.getElapsed())) / 4)
            if (sp) {
                switch (i) {
                    case 0:
                        sphereRed.scale.set(scale, scale, scale);
                        break;
                    case 1:
                        sphereBlue.scale.set(scale, scale, scale);
                        break;
                    case 2:
                        sphereGreen.scale.set(scale, scale, scale);
                        break;
                    default:
                        break;
                }
            }
        }
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
