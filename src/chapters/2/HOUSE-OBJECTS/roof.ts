import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load("/assets/textures/house/roof/albedo.jpg");
albedo.colorSpace = THREE.SRGBColorSpace;
const normal = textureLoader.load("/assets/textures/house/roof/normal.jpg");
const arm = textureLoader.load("/assets/textures/house/roof/arm.jpg");

albedo.wrapS = THREE.RepeatWrapping
normal.wrapS = THREE.RepeatWrapping
arm.wrapS = THREE.RepeatWrapping

albedo.repeat.set(3, 1);
normal.repeat.set(3, 1);
arm.repeat.set(3, 1);

/*
    il materiale e la luce fanno un po schifo su questa
    mesh, e' colpa della uv create dalle geometria
*/

const geometry = new THREE.ConeGeometry(3.5, 2, 4);

geometry.computeVertexNormals()

export const roof = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial(
        {
            map: albedo,
            transparent: true,
            normalMap: normal,
            aoMap: arm,
            metalnessMap: arm,
            metalness: 1,
            roughnessMap: arm,
            roughness: 1,
        }
    )
)