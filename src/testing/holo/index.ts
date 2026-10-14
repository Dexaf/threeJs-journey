import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import Stats from "stats.js";
import { InstancedBufferAttribute, WebGPURenderer } from 'three/webgpu';
import { createHoloMaterial } from './shaders/create-holo-material';
import { createCoreMaterial } from './shaders/create-core-material';
import { createHoloFirefliesParticlesSystemSimulator, HoloFireParticle } from './particles-system/create-holo-fireflies.particles-system-simulator';
import { createParticleHoloMaterial } from './particles-system/materials/create-particle-holo-material';

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
    camera.position.set(3, 1, -5);
    scene.add(camera);

    //RENDERER
    const renderer = new WebGPURenderer({
        canvas: sceneHtmlCanvas,
        antialias: true
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    renderer.setClearColor(new THREE.Color("black"));
    await renderer.init();

    //SECTION - MESH
    const gltfLoader = new GLTFLoader();
    //TODO - MANCA LA GEOMETRIA QUA
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/planet-what/sm_planet_what_lod0.gltf")

    // //ENV MAP
    // const hdrLoader = new HDRLoader();
    // hdrLoader.load("/assets/textures/environmentMap/puresky.hdr", (hdr) => {
    //     hdr.mapping = THREE.EquirectangularReflectionMapping;
    //     renderer.init().then(() => {
    //         const pmrem = new PMREMGenerator(renderer);
    //         const env = pmrem.fromEquirectangular(hdr).texture;
    //         scene.environmentRotation = new THREE.Euler(0, 160, 0);
    //         scene.environmentIntensity = 0.5;
    //         scene.backgroundRotation = new THREE.Euler(0, 160, 0);
    //         scene.environment = env; // filtrata, corretta per IBL
    //         scene.background = hdr;  // originale, più nitida
    //     })
    // })

    //HOLOGRAM MATERIAL
    const uniforms: { [uniform: string]: THREE.IUniform<any>; } = {
        u_time: new THREE.Uniform(0),
    };

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

    //HOLO MATERIAL
    const holoMaterial = await createHoloMaterial();
    const coreMaterial = await createCoreMaterial();

    const mixer = new THREE.AnimationMixer(gltf.scene);

    gltf.animations.forEach(animation => {
        mixer.clipAction(animation).play()
    });

    gltf.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
            switch (obj.material.name) {
                case "m_atlas":
                    obj.material = atlasMaterial;
                    break;
                case "m_hologram":
                    obj.material = holoMaterial;
                    break;
                case "m_core":
                    console.log(obj.name, obj.material.name)
                    obj.material = coreMaterial;
                    const coreLight = new THREE.PointLight("#00f7ff", 3);
                    gltf.scene.getWorldPosition(coreLight.position);
                    scene.add(coreLight);
                    break;
                default:
                    break;
            }
            obj.material.needsUpdate = true;
        }
    })
    scene.add(gltf.scene)
    //!SECTION - MESH

    //SECTION - PS
    const PARTICLES_NUM = 15;

    const positions = new Float32Array(PARTICLES_NUM * 3);
    const positionsAttribute = new InstancedBufferAttribute(positions, 3);
    positionsAttribute.setUsage(THREE.DynamicDrawUsage);

    const sizes = new Float32Array(PARTICLES_NUM);
    for (let index = 0; index < sizes.length; index++) sizes[index] = (Math.random() + 0.5) * 0.8 * window.devicePixelRatio;
    const sizesAttribute = new InstancedBufferAttribute(sizes, 1);
    sizesAttribute.setUsage(THREE.StaticDrawUsage);

    const lifeTimesPerc = new Float32Array(PARTICLES_NUM);
    const lifeTimePercAttribute = new InstancedBufferAttribute(lifeTimesPerc, 1);
    lifeTimePercAttribute.setUsage(THREE.DynamicDrawUsage);

    const hfParticleSystemSimulator = createHoloFirefliesParticlesSystemSimulator(
        //radius
        1,
        //max angle
        90,
        //particlesOnScreen
        PARTICLES_NUM,
        //spawnRate
        200,
        //sync simulation
        (particle) => {
            //update position
            positions[particle.index * 3] = particle.position.x;
            positions[particle.index * 3 + 1] = particle.position.y;
            positions[particle.index * 3 + 2] = particle.position.z;

            //update life time
            lifeTimesPerc[particle.index] = particle.lifespan / particle.startingLifespan;

            lifeTimePercAttribute.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
        }
    );

    const particleHoloMaterial = await createParticleHoloMaterial(
        positionsAttribute,
        sizesAttribute,
        lifeTimePercAttribute
    );
    const particlesSystem = new THREE.Sprite(particleHoloMaterial);
    particlesSystem.count = PARTICLES_NUM;
    particlesSystem.rotateX(Math.PI / 2);
    gltf.scene.add(particlesSystem);
    hfParticleSystemSimulator.systemOrientation = new THREE.Quaternion().setFromEuler(particlesSystem.rotation);
    //!SECTION - PS

    const aLight = new THREE.AmbientLight('white', 2);
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
        hfParticleSystemSimulator.update(deltaTime);
    }

    //NOTE: function to handle animations
    const runAnimations = (deltaTime: number) => {
        mixer.update(deltaTime);
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
