import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load("/assets/textures/house/wall/albedo.jpg");
albedo.colorSpace = THREE.SRGBColorSpace;
const normal = textureLoader.load("/assets/textures/house/wall/normal.jpg");
const arm = textureLoader.load("/assets/textures/house/wall/arm.jpg");

albedo.wrapS = THREE.RepeatWrapping
normal.wrapS = THREE.RepeatWrapping
arm.wrapS = THREE.RepeatWrapping

albedo.wrapT = THREE.RepeatWrapping
normal.wrapT = THREE.RepeatWrapping
arm.wrapT = THREE.RepeatWrapping

export const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    new THREE.MeshStandardMaterial(
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
)