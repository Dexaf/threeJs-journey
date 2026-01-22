import { HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { DEGREE_90 } from '../../constants/ANGLES.ts'
import CANNON from 'cannon';
import { NEUTRAL_DIRECTION, X_DIRECTION, Y_DIRECTION, Y_INV_DIRECTION } from '../../constants/CANNON.DIRECTIONS.ts';
import { CONCRETE_PLASTIC_contactPhysMaterial } from './PHYSICS-OBJECTS/contact-phys-matarials.ts';
import { CONCRETE_PhysMaterial, PLASTIC_PhysMaterial } from './PHYSICS-OBJECTS/phys-materials.ts';
import { time } from 'three/tsl';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const hdrLoader = new HDRLoader();
    const fps = 60;

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-4, 0.5, 7);
    camera.lookAt(scene.position);
    scene.add(camera);

    //SECTION - PHYSICS
    const world = new CANNON.World();
    world.gravity = new CANNON.Vec3(0, -9.8 / 3, 0);
    //called inside frame update routine
    const updateWorld = (deltaTime: number) => {
        world.step(
            1 / fps,    //frame rate of simulation
            deltaTime,  //time from last update
            3           //idk, something about catch up during delays
        );
    }
    world.addContactMaterial(CONCRETE_PLASTIC_contactPhysMaterial);
    const applyPhysics = (deltaTime: number) => {
        // let appliedForce = Y_INV_DIRECTION.clone();
        // appliedForce.y *= 2 * deltaTime;
        // sphereBody.applyLocalImpulse(appliedForce, NEUTRAL_DIRECTION);
    }

    //!SECTION - PHYSICS

    //SECTION - OBJECTS
    //MESH
    //SPHERE
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial(
            {
                color: 'white',
                metalness: 0.9,
                roughness: 0
            }
        )
    );
    sphere.position.y = 2
    sphere.castShadow = true;
    const sphereBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(sphere.position.x, sphere.position.y, sphere.position.z),
        shape: new CANNON.Sphere(0.5),
        material: PLASTIC_PhysMaterial
    });
    world.addBody(sphereBody);

    //PLANE
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({
            color: 'grey',
            metalness: 0.8,
            roughness: 0.1
        })
    )
    plane.position.y = -0.5
    plane.material.side = THREE.DoubleSide;
    plane.rotateX(-DEGREE_90)
    plane.receiveShadow = true;
    const planeBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(plane.position.x, plane.position.y, plane.position.z),
        shape: new CANNON.Plane(), //il piano generato da plane e' infinito,
        material: CONCRETE_PhysMaterial
    });
    planeBody.quaternion.setFromAxisAngle(X_DIRECTION, -DEGREE_90);
    world.addBody(planeBody);


    scene.add(sphere, plane);

    //LIGHTS
    const aLight = new THREE.AmbientLight(0xffffff, 5);
    const dLight = new THREE.DirectionalLight(0xebffff, 3);
    dLight.shadow.mapSize.set(1024, 1024);
    dLight.shadow.radius = 5;
    dLight.position.set(1, 2, -5);
    dLight.castShadow = true;

    scene.add(dLight, aLight);
    //!SECTION - OBJECTS

    const synchronizePhysicsToRenderer = () => {
        sphere.position.copy(sphereBody.position);
        plane.position.copy(planeBody.position);
    }

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    hdrLoader.load('/assets/textures/environmentMap/galaxy_light.hdr', (envMap) => {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = envMap;
        scene.environment = envMap;
    })
    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
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
    const runAnimations = (_: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    let lastRenderTime = 0;
    const timer = new THREE.Timer();
    const timeBetweenFrames = 1000 / fps;
    const animate = () => {
        timer.update();

        const currentTime = timer.getElapsed() * 1000;
        const timeSinceLastRender = currentTime - lastRenderTime;

        if (timeSinceLastRender >= timeBetweenFrames) {
            controls.update();

            //get delta time
            const deltaTime = timeSinceLastRender / 1000
            lastRenderTime = currentTime;

            //update physics
            updateWorld(deltaTime);

            applyPhysics(deltaTime);

            synchronizePhysicsToRenderer();

            //run renderer animation
            runAnimations(deltaTime);

            //render to screen
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

