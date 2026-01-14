import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load("/assets/textures/house/floor/albedo.jpg");
albedo.colorSpace = THREE.SRGBColorSpace;
const alpha = textureLoader.load("/assets/textures/house/floor/alpha.jpg");
const heightMap = textureLoader.load("/assets/textures/house/floor/height-map.jpg");
const normal = textureLoader.load("/assets/textures/house/floor/normal.jpg");
const arm = textureLoader.load("/assets/textures/house/floor/arm.jpg");

albedo.wrapS = THREE.RepeatWrapping
heightMap.wrapS = THREE.RepeatWrapping
normal.wrapS = THREE.RepeatWrapping
arm.wrapS = THREE.RepeatWrapping

albedo.wrapT = THREE.RepeatWrapping
heightMap.wrapT = THREE.RepeatWrapping
normal.wrapT = THREE.RepeatWrapping
arm.wrapT = THREE.RepeatWrapping

albedo.repeat.set(4, 4);
heightMap.repeat.set(4, 4);
normal.repeat.set(4, 4);
arm.repeat.set(4, 4);

export const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 128, 128),
    new THREE.MeshStandardMaterial(
        {
            map: albedo,
            alphaMap: alpha,
            transparent: true,
            normalMap: normal,
            displacementMap: heightMap,
            displacementScale: 0.3,
            displacementBias: - 0.2,
            aoMap: arm,
            metalnessMap: arm,
            metalness: 1,
            roughnessMap: arm,
            roughness: 1,
        }
    )
)