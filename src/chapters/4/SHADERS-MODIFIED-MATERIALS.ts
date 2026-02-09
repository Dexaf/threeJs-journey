import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import { DEGREE_180, DEGREE_90 } from '../../constants/ANGLES';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const wrapperAspectRatio = sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(-15, 6, -30);
    camera.lookAt(scene.position);
    scene.add(camera);

    //LIGHTS
    const dLight = new THREE.DirectionalLight('#ffffff', 3);
    dLight.position.set(3, 10, -10);
    dLight.castShadow = true;
    dLight.shadow.camera.far = 40;
    const cameraSize = 10;
    dLight.shadow.camera.left = -cameraSize;
    dLight.shadow.camera.right = cameraSize;
    dLight.shadow.camera.top = cameraSize;
    dLight.shadow.camera.bottom = -cameraSize;
    dLight.shadow.bias = -0.0001;
    dLight.shadow.normalBias = 0.01;
    dLight.shadow.mapSize.set(512, 512);
    scene.add(dLight);

    //MESHES
    const model = await gltfLoader.loadAsync('/assets/3d-models/LeePerrySmith/LeePerrySmith.glb');
    model.scene.rotateY(-DEGREE_90);

    const mapTexture = textureLoader.load('/assets/3d-models/LeePerrySmith/color.jpg')
    mapTexture.colorSpace = THREE.SRGBColorSpace
    const normalTexture = textureLoader.load('/assets/3d-models/LeePerrySmith/normal.jpg')
    const material = new THREE.MeshStandardMaterial({
        map: mapTexture,
        normalMap: normalTexture
    });
    (model.scene.children[0] as THREE.Mesh).material = material;

    const depthMaterial = new THREE.MeshDepthMaterial(
        {
            depthPacking: THREE.RGBADepthPacking
        }
    );
    (model.scene.children[0] as THREE.Mesh).customDepthMaterial = depthMaterial;

    model.scene.traverse(c => {
        c.receiveShadow = true;
        c.castShadow = true;
    })
    scene.add(model.scene);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial()
    );
    plane.receiveShadow = true;
    plane.position.set(-3, -10, 10);
    plane.rotateX(-DEGREE_180);
    scene.add(plane);

    //HOOKS
    const customUniforms = {
        u_Time: { value: 0 }
    };

    material.onBeforeCompile = (shader) => {

        shader.uniforms = { ...shader.uniforms, ...customUniforms };

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
                #include <common>

                uniform float u_Time;

                mat2 get2dRotateMatrix(float _angle) {
                    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
                }
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <beginnormal_vertex>',
            `
                #include <beginnormal_vertex>
                float angle = 0.3;
                mat2 rotateMatrix = get2dRotateMatrix(angle * position.y + u_Time);
                
                objectNormal.xz *= rotateMatrix;
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
                #include <begin_vertex>
                transformed.xz *= rotateMatrix;
            `
        );
    }
    depthMaterial.onBeforeCompile = (shader) => {
        shader.uniforms = { ...shader.uniforms, ...customUniforms };
        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
                #include <common>

                uniform float u_Time;

                mat2 get2dRotateMatrix(float _angle) {
                    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
                }
            `
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
                #include <begin_vertex>
                float angle = 0.3;
                mat2 rotateMatrix = get2dRotateMatrix(angle * position.y + u_Time);

                transformed.xz *= rotateMatrix;
            `
        );
    }

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //ENV MAP
    const envMap = await cubeTextureLoader.loadAsync([
        '/assets/textures/environmentMap/streets/px.jpg',
        '/assets/textures/environmentMap/streets/nx.jpg',
        '/assets/textures/environmentMap/streets/py.jpg',
        '/assets/textures/environmentMap/streets/ny.jpg',
        '/assets/textures/environmentMap/streets/pz.jpg',
        '/assets/textures/environmentMap/streets/nz.jpg',
    ])
    scene.background = envMap;
    scene.environment = envMap;

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
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
        customUniforms.u_Time.value = timer.getElapsed();
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
