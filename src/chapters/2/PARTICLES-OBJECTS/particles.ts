import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/assets/textures/particles/2.png')
//PARTICLES
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    map: texture,
    transparent: true,
    alphaMap: texture,
    alphaTest: 0.001,
    blending: THREE.AdditiveBlending,
    //ci serve questo attributo per notificare che disegnamo 
    //i colori con gli attributi
    vertexColors: true,
    // depthTest: false,
    // depthWrite: false,
})

export const particleGeometry = new THREE.BufferGeometry();
export const particlesCount = 5000;
const particlesPositions = new Float32Array(particlesCount * 3)
const particlesColors = new Float32Array(particlesCount * 3)

for (let i = 0; i < particlesCount * 3; i += 3) {
    particlesPositions[i] = (Math.random() - 0.5) * 10;
    particlesPositions[i + 1] = (Math.random() - 0.5) * 10;
    particlesPositions[i + 2] = (Math.random() - 0.5) * 10;

    particlesColors[i] = Math.random();
    particlesColors[i + 1] = Math.random();
    particlesColors[i + 2] = Math.random();
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

export const particles = new THREE.Points(particleGeometry, particlesMaterial);