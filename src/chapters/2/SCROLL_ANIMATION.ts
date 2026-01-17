import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const textureLoader = new THREE.TextureLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    scene.add(camera);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //MESHES
    const gradientTexture = textureLoader.load('/assets/textures/gradients/3.jpg');
    gradientTexture.minFilter = THREE.NearestFilter;
    gradientTexture.magFilter = THREE.NearestFilter;

    const box1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshToonMaterial({ color: '#0062ff', gradientMap: gradientTexture }),
    )
    box1.position.set(0, 0, 0)

    const torus1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.2, 10),
        new THREE.MeshToonMaterial({ color: '#00ff08', gradientMap: gradientTexture }),
    )
    torus1.position.set(0, -12, 0)

    const dodecahedron1 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.6),
        new THREE.MeshToonMaterial({ color: '#ff0000', gradientMap: gradientTexture }),
    )
    dodecahedron1.position.set(0, -23.5, 0)
    scene.add(box1, torus1, dodecahedron1);

    //LIGHT
    const alight = new THREE.AmbientLight('#ffffff', 1);

    const light = new THREE.DirectionalLight('#ffffff', 3);
    light.position.set(0, 2, 3);
    scene.add(light, alight);

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
        alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 3;

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    })

    let mousePosition = {
        x: 0,
        y: 0,
    }
    window.addEventListener('pointermove', (p) => {
        mousePosition.x = p.clientX / window.innerWidth - 0.5
        mousePosition.y = p.clientY / window.innerHeight - 0.5

    })

    //LISTENERS
    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY })

    //RENDERING
    //NOTE: function to handle animations
    const runAnimations = (delta: number) => {
        box1.rotateY((Math.PI * 2) * 0.05 * delta)
        torus1.rotateX((Math.PI * 2) * 0.05 * delta)
        dodecahedron1.rotateZ((Math.PI * 2) * 0.05 * delta)
    }

    const runUpdates = (_: number) => {
        //aggiusto altezza camera in base a scroll
        camera.position.set(5, (scrollY / window.document.body.clientHeight) * -12, 0)

        //delta camera in base mouse
        //aggiusto lo sguardo della camera
        camera.lookAt(
            new THREE.Vector3(
                0,
                camera.position.y - mousePosition.y * 1.2,
                0 - mousePosition.x * 1.2
            )
        )
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const fps = 120;
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
            runUpdates(deltaTime);

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
