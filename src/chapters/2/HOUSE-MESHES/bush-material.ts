import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load("/assets/textures/house/bush/leaves_forest_ground_1k/albedo.jpg");
albedo.colorSpace = THREE.SRGBColorSpace;
const normal = textureLoader.load("/assets/textures/house/bush/leaves_forest_ground_1k/normal.jpg");
const arm = textureLoader.load("/assets/textures/house/bush/leaves_forest_ground_1k/arm.jpg");

albedo.wrapS = THREE.RepeatWrapping
normal.wrapS = THREE.RepeatWrapping
arm.wrapS = THREE.RepeatWrapping

albedo.wrapT = THREE.RepeatWrapping
normal.wrapT = THREE.RepeatWrapping
arm.wrapT = THREE.RepeatWrapping

export const bushMaterial = new THREE.MeshStandardMaterial(
    {
        map: albedo,
        transparent: true,
        normalMap: normal,
        aoMap: arm,
        metalnessMap: arm,
        metalness: 0.3,
        roughnessMap: arm,
        roughness: 1,
    }
)