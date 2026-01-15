import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load("/assets/textures/door/albedo.jpg");
albedo.colorSpace = THREE.SRGBColorSpace;
const alpha = textureLoader.load("/assets/textures/door/alpha.jpg");
const heightMap = textureLoader.load("/assets/textures/door/height-map.jpg");
const metalness = textureLoader.load("/assets/textures/door/metalness.jpg");
const normal = textureLoader.load("/assets/textures/door/normal.jpg");
const occlusion = textureLoader.load("/assets/textures/door/occlusion.jpg");
const roughness = textureLoader.load("/assets/textures/door/roughness.jpg");

export const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 36),
    new THREE.MeshStandardMaterial(
        {
            color: 0x808080,
            map: albedo,
            alphaMap: alpha,
            transparent: true,
            normalMap: normal,
            metalnessMap: metalness,
            metalness: 1,
            roughnessMap: roughness,
            roughness: 1,
            displacementMap: heightMap,
            displacementScale: 0.1,
            aoMap: occlusion,
        }
    )
)