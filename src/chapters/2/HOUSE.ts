import { OrbitControls, Sky } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { door } from './HOUSE-OBJECTS/door';
import { terrain } from './HOUSE-OBJECTS/terrain';
import { walls } from './HOUSE-OBJECTS/walls';
import { bushMaterial } from './HOUSE-OBJECTS/bush-material';
import { roof } from './HOUSE-OBJECTS/roof';
import { graveMaterial } from './HOUSE-OBJECTS/grave-material';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;
if (sceneHtmlCanvas) {
    //CONSTANTS
    const DEG_90 = -Math.PI / 2;
    const DEG_45 = -Math.PI / 4;

    //SCENE
    const scene = new THREE.Scene();

    //MESHES
    //TERRAIN
    terrain.rotateX(DEG_90)
    terrain.receiveShadow = true;
    scene.add(terrain);

    //GRAVES
    const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
    const gravesGroup = new THREE.Group();

    for (let i = 0; i < 35; i++) {
        const grave = new THREE.Mesh(graveGeometry, graveMaterial);

        //POSITIONING
        const rndAnglePos = Math.random() * (Math.PI * 2);
        const rndDistancePos = Math.random() * 4 + 3.85;
        grave.position.set(
            rndDistancePos * Math.cos(rndAnglePos),
            0.2,
            rndDistancePos * Math.sin(rndAnglePos),
        )

        //ROTATION
        const rndAngleRotX = (Math.random() - 0.5) * DEG_45;
        const rndAngleRotZ = (Math.random() - 0.5) * DEG_45;

        grave.rotateX(rndAngleRotX);
        grave.rotateZ(rndAngleRotZ);

        grave.castShadow = true; grave.receiveShadow = true;

        gravesGroup.add(grave);
    }

    scene.add(gravesGroup);
    //HOUSE
    //HOUSE - WALLS
    const houseGroup = new THREE.Group();
    walls.castShadow = true; walls.receiveShadow = true;
    walls.position.y = 1.5;

    //HOUSE - ROOF
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.y = 3.85;
    roof.rotateY(DEG_45)

    //HOUSE - DOOR
    door.castShadow = true;
    door.receiveShadow = true;
    door.position.y = 0.9;
    door.position.z = 2.05;

    //HOUSE - BUSH
    const bushesGroup = new THREE.Group();

    const bushGeometry = new THREE.SphereGeometry(1, 36, 36);

    const bush1 = new THREE.Mesh(
        bushGeometry,
        bushMaterial
    );
    bush1.position.set(2, 0, 2)
    bush1.rotateX(-0.75);
    bush1.receiveShadow = true;

    const bush2 = new THREE.Mesh(
        bushGeometry,
        bushMaterial
    );
    bush2.position.set(-2, 0, 1.8);
    bush2.scale.set(0.8, 0.8, 0.8);
    bush2.rotateX(-0.75);
    bush2.receiveShadow = true;

    const bush3 = new THREE.Mesh(
        bushGeometry,
        bushMaterial
    );
    bush3.position.set(2, 0, 0.8);
    bush3.scale.set(0.4, 0.4, 0.4);
    bush3.rotateX(-0.75);
    bush3.receiveShadow = true;

    bushesGroup.add(bush1, bush2, bush3);
    houseGroup.add(door, walls, roof, bushesGroup);
    scene.add(houseGroup);

    //LIGHTS
    const hemisphereLight = new THREE.HemisphereLight(0xffaaaa, 0x86cdff, 1);
    const directionalLight = new THREE.DirectionalLight(0x86cdff, 1);
    directionalLight.position.set(-20, 5, -20);
    directionalLight.castShadow = true;
    directionalLight.shadow.radius = 3;
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -12
    directionalLight.shadow.camera.right = 12
    directionalLight.shadow.mapSize.set(256, 256);
    const pointLight = new THREE.PointLight(0xff0000, 0.1);
    pointLight.position.set(door.position.x + 0.4, door.position.y, door.position.z + 0.1);
    scene.add(hemisphereLight, directionalLight, pointLight);

    //SKY
    //e' un addon per un oggetto (cubo) con shader che simula una skybox
    //questa mesh e' uno shader material
    const sky = new Sky();
    sky.scale.set(100, 100, 100)
    sky.material.uniforms['turbidity'].value = 50
    sky.material.uniforms['rayleigh'].value = 3
    sky.material.uniforms['mieCoefficient'].value = 0.1
    sky.material.uniforms['mieDirectionalG'].value = 0.95
    sky.material.uniforms['sunPosition'].value.set(-1, -0.038, -1)
    scene.add(sky);

    //FOG
    scene.fog = new THREE.FogExp2('#04343f', 0.05)

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );

    camera.position.set(4, 6, 15);
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
    const runAnimations = (_: number) => {
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const fps = 60;
    let lastRenderTime = 0;
    const timer = new THREE.Timer();
    const timeBetweenFrames = 1000 / fps;
    const animate = () => {
        timer.update();
        orbitControls.update();

        const currentTime = timer.getElapsed() * 1000;

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
