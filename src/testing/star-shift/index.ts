import { OrbitControls } from "three/examples/jsm/Addons.js";
import "../../style.css";
import * as THREE from "three";

import {
    createParticles,
    defaultParticlesParameters,
    uniforms,
    type ParticlesParameters,
} from "./particles";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

const sceneHtmlCanvas = document.getElementById(
    "three-scene-canvas",
) as HTMLCanvasElement | null;

if (sceneHtmlCanvas) {
    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const wrapperAspectRatio =
        sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight;

    const camera = new THREE.PerspectiveCamera(
        45,
        wrapperAspectRatio,
    );

    camera.position.set(0, 0, 6);
    camera.lookAt(scene.position);
    scene.add(camera);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: sceneHtmlCanvas,
        antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

    renderer.setSize(
        sceneHtmlCanvas.clientWidth,
        sceneHtmlCanvas.clientHeight,
        false,
    );

    // PARTICLE PARAMETERS
    const particleParameters: ParticlesParameters = {
        ...defaultParticlesParameters,
    };

    const guiState = {
        // Uniform/runtime
        particleSize: 100,
        timeScale: 1,
        paused: false,

        // Posizione dell'intero sistema
        systemPositionX: 0,
        systemPositionY: 0,
        systemPositionZ: -3,

        // Azioni
        resetTime: () => {
            uniforms.u_time.value = 0;
        },

        regenerate: () => {
            rebuildParticles();
        },
    };

    /**
     * u_size contiene la dimensione corretta per il pixel ratio.
     * In GUI viene invece mostrata una dimensione indipendente dal display.
     */
    const updateParticleSizeUniform = () => {
        uniforms.u_size.value =
            guiState.particleSize * renderer.getPixelRatio();
    };

    /**
     * Usa la dimensione effettiva del drawing buffer WebGL.
     */
    const updateResolutionUniform = () => {
        renderer.getDrawingBufferSize(uniforms.u_resolution.value);
    };

    updateParticleSizeUniform();
    updateResolutionUniform();

    // PARTICLES
    let particles = createParticles(particleParameters);

    particles.position.set(
        guiState.systemPositionX,
        guiState.systemPositionY,
        guiState.systemPositionZ,
    );

    scene.add(particles);

    /**
     * Ricrea geometria e materiale esclusivamente quando cambia
     * un parametro fisico del sistema.
     */
    const rebuildParticles = () => {
        const previousParticles = particles;

        particles = createParticles(particleParameters);

        particles.position.copy(previousParticles.position);
        particles.rotation.copy(previousParticles.rotation);
        particles.scale.copy(previousParticles.scale);

        scene.add(particles);
        scene.remove(previousParticles);

        previousParticles.geometry.dispose();
        previousParticles.material.dispose();
    };

    // LIGHT
    const light = new THREE.DirectionalLight("white", 3);
    light.position.set(0, 5, 0);
    scene.add(light);

    // CONTROLS
    const controls = new OrbitControls(camera, sceneHtmlCanvas);
    controls.enableDamping = true;

    // GUI
    const gui = new GUI({
        title: "Particles",
    });

    /*
     * Questi parametri modificano uniform o proprietà dell'oggetto:
     * non richiedono una nuova geometria.
     */
    const shaderFolder = gui.addFolder("Shader");

    shaderFolder
        .add(guiState, "particleSize", 1, 300, 1)
        .name("Dimensione")
        .onChange(updateParticleSizeUniform);

    shaderFolder
        .add(guiState, "timeScale", 0, 5, 0.01)
        .name("Velocità tempo");

    shaderFolder
        .add(guiState, "paused")
        .name("Pausa");

    shaderFolder
        .add(guiState, "resetTime")
        .name("Reset tempo");

    const movementFolder = gui.addFolder("Movimento");

    movementFolder
        .add(uniforms.u_acceleration, "value", 0.01, 10, 0.01)
        .name("Accelerazione");

    movementFolder
        .add(uniforms.u_maxVelocity, "value", 0.01, 20, 0.01)
        .name("Velocità massima");

    movementFolder
        .add(uniforms.u_loopDistance, "value", 1, 50, 0.1)
        .name("Lunghezza loop");

    movementFolder
        .add(uniforms.u_motionSample, "value", 0.001, 0.1, 0.001)
        .name("Campione movimento");

    const headFolder = gui.addFolder("Testa");

    headFolder
        .add(uniforms.u_headSize, "value", 0.01, 3, 0.01)
        .name("Dimensione");

    headFolder
        .add(uniforms.u_headFalloff, "value", 0.1, 50, 0.1)
        .name("Falloff");

    headFolder
        .add(uniforms.u_headIntensity, "value", 0, 3, 0.01)
        .name("Intensità");

    const tailFolder = gui.addFolder("Coda");

    tailFolder
        .add(uniforms.u_tailLength, "value", 0.01, 8, 0.01)
        .name("Lunghezza");

    tailFolder
        .add(uniforms.u_tailThickness, "value", 0.01, 2, 0.01)
        .name("Spessore base");

    tailFolder
        .add(uniforms.u_tailHeadThickness, "value", 0.1, 5, 0.01)
        .name("Spessore alla testa");

    tailFolder
        .add(uniforms.u_tailTaperFalloff, "value", 0.1, 10, 0.1)
        .name("Falloff spessore");

    tailFolder
        .add(uniforms.u_tailEdgeFalloff, "value", 0.1, 100, 0.1)
        .name("Falloff bordi");

    tailFolder
        .add(uniforms.u_tailLengthFalloff, "value", 0.1, 10, 0.1)
        .name("Falloff lunghezza");

    tailFolder
        .add(uniforms.u_tailIntensity, "value", 0, 3, 0.01)
        .name("Intensità");

    const outputFolder = gui.addFolder("Output");

    outputFolder
        .add(uniforms.u_opacity, "value", 0, 1, 0.01)
        .name("Opacità");
    /*
     * u_resolution viene gestita automaticamente sulla base del canvas.
     * I due controller sono in ascolto e servono a visualizzarne il valore.
     */
    const resolutionState = {
        width: uniforms.u_resolution.value.x,
        height: uniforms.u_resolution.value.y,
    };

    const resolutionWidthController = shaderFolder
        .add(resolutionState, "width")
        .name("Resolution X")
        .listen()
        .disable();

    const resolutionHeightController = shaderFolder
        .add(resolutionState, "height")
        .name("Resolution Y")
        .listen()
        .disable();

    /*
     * Spostare l'intero Points non richiede la rigenerazione
     * della geometria.
     */
    const transformFolder = gui.addFolder("Posizione sistema");

    transformFolder
        .add(guiState, "systemPositionX", -10, 10, 0.01)
        .name("Posizione X")
        .onChange((value: number) => {
            particles.position.x = value;
        });

    transformFolder
        .add(guiState, "systemPositionY", -10, 10, 0.01)
        .name("Posizione Y")
        .onChange((value: number) => {
            particles.position.y = value;
        });

    transformFolder
        .add(guiState, "systemPositionZ", -20, 5, 0.01)
        .name("Posizione Z")
        .onChange((value: number) => {
            particles.position.z = value;
        });

    /*
     * Questi parametri cambiano gli attributi BufferGeometry.
     * onFinishChange evita di ricreare il sistema per ogni piccolo
     * movimento dello slider.
     */
    const geometryFolder = gui.addFolder("Geometria");

    geometryFolder
        .add(
            particleParameters,
            "particlesNumber",
            1,
            5000,
            1,
        )
        .name("Numero particelle")
        .onFinishChange((value: number) => {
            particleParameters.particlesNumber = Math.round(value);
            rebuildParticles();
        });

    geometryFolder
        .add(particleParameters, "distanceX", 0.1, 20, 0.1)
        .name("Estensione X")
        .onFinishChange(rebuildParticles);

    geometryFolder
        .add(particleParameters, "distanceY", 0.1, 20, 0.1)
        .name("Estensione Y")
        .onFinishChange(rebuildParticles);

    geometryFolder
        .add(particleParameters, "distanceZ", 0.1, 20, 0.1)
        .name("Estensione Z")
        .onFinishChange(rebuildParticles);

    geometryFolder
        .add(
            particleParameters,
            "minCenterDistance",
            0,
            10,
            0.01,
        )
        .name("Vuoto centrale")
        .onFinishChange(rebuildParticles);

    geometryFolder
        .add(guiState, "regenerate")
        .name("Rigenera casualmente");

    // RESIZE
    const handleResize = () => {
        const width = sceneHtmlCanvas.clientWidth;
        const height = sceneHtmlCanvas.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 3),
        );

        renderer.setSize(width, height, false);

        updateParticleSizeUniform();
        updateResolutionUniform();

        resolutionState.width = uniforms.u_resolution.value.x;
        resolutionState.height = uniforms.u_resolution.value.y;

        resolutionWidthController.updateDisplay();
        resolutionHeightController.updateDisplay();
    };

    window.addEventListener("resize", handleResize);

    // LOGIC
    const runLogic = (deltaTime: number) => {
        if (guiState.paused) {
            return;
        }

        uniforms.u_time.value += deltaTime * guiState.timeScale;
    };

    const runAnimations = (_deltaTime: number) => {
        // Animazioni aggiuntive.
    };

    // RENDER LOOP
    const timer = new THREE.Timer();

    const animate = () => {
        timer.update();
        controls.update();

        const deltaTime = timer.getDelta();

        runLogic(deltaTime);
        runAnimations(deltaTime);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    animate();

    // FULLSCREEN
    const toggleFullScreen = async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await sceneHtmlCanvas.requestFullscreen();
        }
    };

    sceneHtmlCanvas.addEventListener(
        "dblclick",
        toggleFullScreen,
    );
} else {
    alert("MANCA IL WRAPPER PER LA SCENA");
}