import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../../style.css'
import * as THREE from 'three'
import vertexShader from './shaders/11/vertex.glsl?raw';
import fragmentShader from './shaders/11/fragment.glsl?raw';

//SCENE HTML CANVAS
const sceneHtmlCanvas = document.getElementById("three-scene-canvas") as HTMLCanvasElement;

if (sceneHtmlCanvas) {
    const textureLoader = new THREE.TextureLoader();

    //SCENE
    const scene = new THREE.Scene();

    //CAMERA
    const sizes = {
        width: sceneHtmlCanvas.clientWidth,
        height: sceneHtmlCanvas.clientHeight,
        resolution: new THREE.Vector2(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight)
    }
    const wrapperAspectRatio = sizes.width / sizes.height;
    const camera = new THREE.PerspectiveCamera(
        45,                 // FOV - FIELD OF VIEW
        wrapperAspectRatio  // ASPECT RATIO
    );
    camera.position.set(0, 0, 18);
    camera.lookAt(scene.position);
    scene.add(camera);

    //CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas)
    controls.enableDamping = true;

    //MESH 
    //SECTION - DISPLACEMENT
    const glowImage = new Image();
    glowImage.src = '/assets/textures/brush/glow.png';
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const displacement = {
        canvas: canvas,
        context: canvas.getContext('2d')!,
        glowImage: glowImage!,
        texture: new THREE.CanvasTexture(canvas),
    };

    displacement.canvas.width = 128;
    displacement.canvas.height = 128;
    displacement.canvas.style.border = '1px red solid'
    displacement.canvas.style.position = 'fixed';
    displacement.canvas.style.width = '256px';
    displacement.canvas.style.height = '256px';
    displacement.canvas.style.bottom = '0';
    displacement.canvas.style.left = '0';
    displacement.canvas.style.zIndex = '10';
    document.body.appendChild(displacement.canvas);

    //sfondo nero
    displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);
    let canDraw = false;
    displacement.glowImage!.onload = (_: Event) => {
        canDraw = true;
    }

    //!SECTION - DISPLACEMENT
    const texture = await textureLoader.loadAsync('/assets/textures/pokeball/pokeball.png');
    const uniforms = {
        u_resolution: new THREE.Uniform(sizes.resolution),
        u_texture: new THREE.Uniform(texture),
        u_displacementTexture: new THREE.Uniform(displacement.texture)
    };
    const planeGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
    planeGeometry.setIndex(null);
    const intensitiesArray = new Float32Array(planeGeometry.attributes.position.count)
    for (let i = 0; i < planeGeometry.attributes.position.count; i++) {
        intensitiesArray[i] = Math.random()
    }
    planeGeometry.setAttribute('a_intensity', new THREE.BufferAttribute(intensitiesArray, 1))

    const material = new THREE.ShaderMaterial(
        {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            blending: THREE.AdditiveBlending
        }
    )
    const particlePlane = new THREE.Points(planeGeometry, material)
    scene.add(particlePlane)

    const drawPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10, 128, 128),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    )
    drawPlane.visible = false;
    scene.add(drawPlane)

    //RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas
    })
    renderer.setSize(sceneHtmlCanvas.clientWidth, sceneHtmlCanvas.clientHeight);
    //render e' come se facesse uno screenshot della scena 3D attiva
    renderer.render(scene, camera);

    //RESIZING CANVAS AND CAMERA
    window.addEventListener('resize', () => {
        sizes.width = sceneHtmlCanvas.clientWidth;
        sizes.height = sceneHtmlCanvas.clientHeight;
        sizes.resolution.x = sceneHtmlCanvas.clientWidth * renderer.getPixelRatio();
        sizes.resolution.y = sceneHtmlCanvas.clientHeight * renderer.getPixelRatio();

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
    })

    //RENDERING
    const raycaster = new THREE.Raycaster();
    let mousePosition: { x: null | number, y: null | number } = {
        x: 0,
        y: 0,
    }
    sceneHtmlCanvas.addEventListener('pointermove', (e) => {
        //first we need to make the position of the mouse
        //is calculated as if the left side of the canvas is the starting point
        const walledX = e.clientX - sceneHtmlCanvas.getBoundingClientRect().left;
        //then we need to normalize it to be sure that we get values from 0 to 1
        let normalizedX = walledX / sceneHtmlCanvas.width;
        //to finish we need to be sure to not go over 1 when going to right
        normalizedX = normalizedX > 1 ? 1 : normalizedX;

        //do the same with y
        const walledY = e.clientY - sceneHtmlCanvas.getBoundingClientRect().top;
        let normalizedY = walledY / sceneHtmlCanvas.height;
        normalizedY = normalizedY > 1 ? 1 : normalizedY;

        mousePosition.x = normalizedX;
        mousePosition.y = normalizedY;
    })
    sceneHtmlCanvas.addEventListener('pointerleave', (_) => {
        mousePosition.x = null;
        mousePosition.y = null;
    });
    const runLogic = (_: number) => {
        //TODO FAI APPUNTI E CONTROLLA QUELLA ROBA DEL INDEX
        //clean the square by overwriting what we see bit by bit with a fade
        displacement.context.globalCompositeOperation = 'source-over';
        displacement.context.globalAlpha = 0.05;
        displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

        if (canDraw && mousePosition.x && mousePosition.y) {
            const mouseCoordForRaycast = new THREE.Vector2();
            mouseCoordForRaycast.setX(mousePosition.x * 2 - 1);
            mouseCoordForRaycast.setY(mousePosition.y * 2 - 1);
            raycaster.setFromCamera(mouseCoordForRaycast, camera);
            const hit = raycaster.intersectObject(drawPlane);
            if (hit.length > 0) {
                const uv = hit[0].uv!;

                //make drawSize costant to canvas width
                const drawSize = displacement.canvas.width * 0.10;
                //lighten make so that when drawing, instead of overlapping,
                //the displayed result is just the sum of the brightest pixels
                displacement.context.globalCompositeOperation = 'lighten';
                displacement.context.globalAlpha = 1;
                displacement.context.drawImage(
                    displacement.glowImage,
                    displacement.canvas.width * uv.x - (drawSize / 2),
                    displacement.canvas.height * uv.y - (drawSize / 2),
                    drawSize,
                    drawSize
                );
            }
        }


        //update the texture that we send to the uniform with what we see in the canvas
        displacement.texture.needsUpdate = true
    }

    //NOTE: function to handle animations
    const runAnimations = (_: number) => {
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
