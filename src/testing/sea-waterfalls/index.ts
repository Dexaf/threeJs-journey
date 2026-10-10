import { GLTFLoader, HDRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import Stats from "stats.js";
import { PMREMGenerator, WebGPURenderer } from 'three/webgpu';
import { createSeaMaterial } from './shaders/sea/create-sea-material';
import { createWaterfallMaterialV2 } from './shaders/sea/create-waterfall-material';
import { createWaterfallBasisMaterial } from './shaders/sea/create-waterfall-basis-material';
import { createChuparoo } from './objects/create-chuparoo';
import { createAllChuparoos } from './objects/create-all-chuparoos';
import { createTardon } from './objects/create-tardon';
import { createAllTardons } from './objects/create-all-tardons';
import { createBrachioslug } from './objects/create-brachioslug';
import { createAllBrachioslugs } from './objects/create-all-brachioslugs';
import { createGrass, placeGrassInstances } from './objects/create-grass';
import { createGrassMaterial } from './shaders/create-grass-material';

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
    camera.near = 0.1;
    camera.far = 50;
    //serve per aggiornare la proj matrix usata negli shader
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, -5);
    scene.add(camera);

    //RENDERER
    const renderer = new WebGPURenderer({
        canvas: sceneHtmlCanvas,
        antialias: false
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);

    //SECTION - MESH 
    const gltfLoader = new GLTFLoader();
    //TODO - MANCA LA GEOMETRIA QUA
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/other/sm_planet_why_lod0.gltf")

    //ENV MAP
    const hdrLoader = new HDRLoader();
    hdrLoader.load("/assets/textures/environmentMap/puresky.hdr", (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        renderer.init().then(() => {
            const pmrem = new PMREMGenerator(renderer);
            const env = pmrem.fromEquirectangular(hdr).texture;
            scene.environmentRotation = new THREE.Euler(0, 160, 0);
            scene.environmentIntensity = 0.5;
            scene.backgroundRotation = new THREE.Euler(0, 160, 0);
            scene.environment = env; // filtrata, corretta per IBL
            scene.background = hdr;  // originale, più nitida
        })
    })

    //HOLOGRAM MATERIAL
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
    };

    const seaMat = await createSeaMaterial(renderer);
    const waterfallMat = await createWaterfallMaterialV2(renderer);
    const waterfallBasisMat = await createWaterfallBasisMaterial(renderer);

    //ATLAS MATERIAL
    const textureLoader = new THREE.TextureLoader();
    const atlasMap = await textureLoader.loadAsync("/assets/textures/atlas.jpg")
    atlasMap.colorSpace = THREE.SRGBColorSpace;
    atlasMap.flipY = false;
    atlasMap.wrapS = THREE.RepeatWrapping;
    atlasMap.wrapT = THREE.RepeatWrapping;

    const atlasMaterial = new THREE.MeshStandardMaterial({ map: atlasMap });
    atlasMaterial.side = THREE.DoubleSide;
    atlasMaterial.transparent = false;
    atlasMaterial.depthTest = true;
    atlasMaterial.depthWrite = true;

    gltf.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
            console.log(obj.material.name);
            switch (obj.material.name) {
                case "m_atlas":
                    obj.material = atlasMaterial;
                    break;
                case "m_water":
                    obj.material = seaMat;
                    break;
                case "m_water_surface":
                    obj.material = waterfallBasisMat;
                    break;
                case "m_waterfall":
                    obj.material = waterfallMat;
                    break;
                default:
                    break;
            }
            obj.material.needsUpdate = true;
        }
    })
    scene.add(gltf.scene)
    //!SECTION - MESH 

    //SECTION - ANIMALS
    //CHUPAROO
    const chuparooGltf = await createChuparoo(renderer);
    //connect material
    chuparooGltf.scene.traverse(o => {
        if (o instanceof THREE.SkinnedMesh)
            o.material = atlasMaterial;
    })
    //create actors
    const chuparooActors = createAllChuparoos(chuparooGltf)
    chuparooActors.forEach(actor => scene.add(actor.root));

    //TARDON
    const tardonGltf = await createTardon(renderer);
    //connect material
    tardonGltf.scene.traverse(o => {
        if (o instanceof THREE.SkinnedMesh)
            o.material = atlasMaterial;
    })
    //create actors
    const tardonActors = createAllTardons(tardonGltf)
    tardonActors.forEach(actor => scene.add(actor.root));

    //BRACHIOSLUG
    const brachioslugGltf = await createBrachioslug(renderer);
    //connect material
    brachioslugGltf.scene.traverse(o => {
        if (o instanceof THREE.SkinnedMesh)
            o.material = atlasMaterial;
    })
    //create actors
    const brachioslugActors = createAllBrachioslugs(brachioslugGltf)
    brachioslugActors.forEach(actor => scene.add(actor.root));
    //!SECTION - ANIMALS

    //SECTION - LEAVES
    const grassMaterial = await createGrassMaterial();
    const grass = await createGrass();
    let grassGeometry: THREE.BufferGeometry | undefined;
    grass.traverse(child => {
        if (!grassGeometry && child instanceof THREE.Mesh) {
            grassGeometry = child.geometry;
            grassGeometry!.scale(0.1, 0.1, 0.1)
        }
    });
    const grassInstances = new THREE.InstancedMesh(
        grassGeometry,
        grassMaterial,
        50
    );
    placeGrassInstances(
        grassInstances,
        new THREE.Vector3(0, 0.2, -1.5),
        0.98,
        0.3
    );
    scene.add(grassInstances);
    //!SECTION - LEAVES

    const sun = new THREE.DirectionalLight('white', 2);
    sun.position.set(-2, 1, -1.5)
    scene.add(sun)
    const aLight = new THREE.AmbientLight('white', 1.5);
    scene.add(aLight)

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        camera.aspect = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    })

    //RENDERING
    const runLogic = (deltaTime: number) => {
        uniforms.u_time.value += deltaTime;
    }

    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        chuparooActors.forEach(actor => {
            if (actor.bodyAction || actor.placeAction) actor.mixer.update(deltaTime);
        })
        tardonActors.forEach(actor => {
            if (actor.bodyAction || actor.placeAction) actor.mixer.update(deltaTime);
        })
        brachioslugActors.forEach(actor => {
            if (actor.bodyAction || actor.placeAction) actor.mixer.update(deltaTime);
        })
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    const timer = new THREE.Timer();
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const animate = () => {
        stats.begin();
        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();
        runLogic(deltaTime);
        runAnimations(deltaTime);

        renderer.render(scene, camera);

        stats.end();
        console.info(
            'calls', renderer.info.render.drawCalls,
            'triangles', renderer.info.render.triangles,
            'geometries', renderer.info.memory.geometries,
            'textures', renderer.info.memory.textures
        )
        requestAnimationFrame(animate);
    }
    renderer.init().then(() => animate());

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
