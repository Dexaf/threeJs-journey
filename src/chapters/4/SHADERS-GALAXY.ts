import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import '../../style.css'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
import vertexShader from './shaders/4/vertex.glsl?raw';
import fragmentShader from './shaders/4/fragment.glsl?raw';

// ==============================
// HTML CANVAS
// ==============================
const sceneHtmlCanvas = document.getElementById(
    'three-scene-canvas'
) as HTMLCanvasElement

if (!sceneHtmlCanvas) {
    alert('MANCA IL WRAPPER PER LA SCENA')
    throw new Error('Canvas non trovato')
}

// ==============================
// SCENE
// ==============================
const scene = new THREE.Scene()

// ==============================
// CAMERA
// ==============================
const aspectRatio =
    sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight

const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100)
camera.position.set(1, 1, 1)
scene.add(camera)

// ==============================
// CONTROLS
// ==============================
const controls = new OrbitControls(camera, sceneHtmlCanvas)
controls.enableDamping = true

// ==============================
// RENDERER
// ==============================
const renderer = new THREE.WebGLRenderer({
    canvas: sceneHtmlCanvas,
    antialias: true
})

renderer.setSize(
    sceneHtmlCanvas.clientWidth,
    sceneHtmlCanvas.clientHeight
)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))

// ==============================
// GALAXY
// ==============================
const galaxyUniforms: { [uniform: string]: THREE.IUniform<any>; } = {
    u_time: { value: 0 },
    u_count: { value: 200000 },
    u_size: { value: 40 },
    u_radius: { value: 5 },
    u_branches: { value: 3 },
    u_randomness: { value: 0.5 },
    u_randomnessPower: { value: 3 },
    u_insideColor: { value: new THREE.Color('#307fff') },
    u_outsideColor: { value: new THREE.Color('#26ff00') }
}

let galaxyGeometry: THREE.BufferGeometry | null = null
let galaxyMaterial: THREE.ShaderMaterial | null = null
let galaxyPoints: THREE.Points | null = null

const generateGalaxy = () => {
    if (galaxyPoints) {
        galaxyGeometry?.dispose()
        galaxyMaterial?.dispose()
        scene.remove(galaxyPoints)
    }

    galaxyGeometry = new THREE.BufferGeometry()

    const positions = new Float32Array(galaxyUniforms.u_count.value * 3)
    const randomSizeMultiplier = new Float32Array(galaxyUniforms.u_count.value)
    const colors = new Float32Array(galaxyUniforms.u_count.value * 3)

    const insideColor = new THREE.Color(galaxyUniforms.u_insideColor.value)
    const outsideColor = new THREE.Color(galaxyUniforms.u_outsideColor.value)

    for (let i = 0; i < galaxyUniforms.u_count.value; i++) {
        const i3 = i * 3

        const radius = Math.random() * galaxyUniforms.u_radius.value
        const branchAngle =
            (i % galaxyUniforms.u_branches.value) /
            galaxyUniforms.u_branches.value *
            Math.PI *
            2

        const randomX =
            Math.pow(Math.random(), galaxyUniforms.u_randomnessPower.value) *
            (Math.random() < 0.5 ? 1 : -1) *
            galaxyUniforms.u_randomness.value *
            radius

        const randomY =
            Math.pow(Math.random(), galaxyUniforms.u_randomnessPower.value) *
            (Math.random() < 0.5 ? 1 : -1) *
            galaxyUniforms.u_randomness.value *
            radius

        const randomZ =
            Math.pow(Math.random(), galaxyUniforms.u_randomnessPower.value) *
            (Math.random() < 0.5 ? 1 : -1) *
            galaxyUniforms.u_randomness.value *
            radius

        positions[i3] = Math.cos(branchAngle) * radius + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle) * radius + randomZ

        const mixedColor = insideColor.clone()
        mixedColor.lerp(outsideColor, radius / galaxyUniforms.u_radius.value)

        colors[i3] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b

        randomSizeMultiplier[i] = Math.random() + 0.1;
    }

    galaxyGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    )
    galaxyGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
    )
    galaxyGeometry.setAttribute(
        'a_randomSizeMultiplier',
        new THREE.BufferAttribute(randomSizeMultiplier, 1)
    )

    galaxyMaterial = new THREE.ShaderMaterial({
        // size: galaxyParams.size,
        // sizeAttenuation: true,
        uniforms: {
            ...galaxyUniforms,
            u_size: {
                value: galaxyUniforms.u_size.value * renderer.getPixelRatio()
            }
        },
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
    })

    galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial)
    scene.add(galaxyPoints)
}

// CREA GALASSIA
generateGalaxy()

const gui = new GUI({
    title: 'Galaxy Controls',
    width: 320
})

gui.add(galaxyUniforms.u_count, 'value', 100, 1_000_000, 100).name('Stars').onFinishChange(generateGalaxy)
gui.add(galaxyUniforms.u_size, 'value', 1, 50, 1).name('size').onFinishChange(generateGalaxy)
gui.add(galaxyUniforms.u_radius, 'value', 0.1, 20, 0.01).name('Radius').onFinishChange(generateGalaxy)
gui.add(galaxyUniforms.u_branches, 'value', 2, 20, 1).name('Branches').onFinishChange(generateGalaxy)
gui.add(galaxyUniforms.u_randomness, 'value', 0, 2, 0.001).name('Randomness').onFinishChange(generateGalaxy)
gui.add(galaxyUniforms.u_randomnessPower, 'value', 1, 10, 0.001).name('Random Power').onFinishChange(generateGalaxy)
gui.addColor(galaxyUniforms.u_insideColor, 'value').name('Inside Color').onFinishChange(generateGalaxy)
gui.addColor(galaxyUniforms.u_outsideColor, 'value').name('Outside Color').onFinishChange(generateGalaxy)

// ==============================
// RESIZE
// ==============================
window.addEventListener('resize', () => {
    camera.aspect =
        sceneHtmlCanvas.clientWidth / sceneHtmlCanvas.clientHeight
    camera.updateProjectionMatrix()

    renderer.setSize(
        sceneHtmlCanvas.clientWidth,
        sceneHtmlCanvas.clientHeight
    )
})

// ==============================
// ANIMATION LOOP
// ==============================
const fps = 60
const timeBetweenFrames = 1000 / fps
let lastRenderTime = 0

const timer = new THREE.Timer()

const runLogic = (_: number) => {
    galaxyUniforms.u_time.value = timer.getElapsed();
}

const runAnimations = (deltaTime: number) => {
    if (galaxyPoints) {
        galaxyPoints.rotation.y += deltaTime * 0.05
    }
}

const animate = () => {
    timer.update()
    controls.update()

    const currentTime = timer.getElapsed() * 1000
    const deltaMs = currentTime - lastRenderTime

    if (deltaMs >= timeBetweenFrames) {
        const deltaTime = deltaMs / 1000
        lastRenderTime = currentTime
        runLogic(deltaTime);
        runAnimations(deltaTime)
        renderer.render(scene, camera)
    }

    requestAnimationFrame(animate)
}

animate()

// ==============================
// FULLSCREEN
// ==============================
let isFullscreenOn = false

const toggleFullScreen = () => {
    if (!isFullscreenOn) {
        sceneHtmlCanvas.requestFullscreen()
    } else {
        document.exitFullscreen()
    }
    isFullscreenOn = !isFullscreenOn
}

sceneHtmlCanvas.addEventListener('dblclick', toggleFullScreen)
