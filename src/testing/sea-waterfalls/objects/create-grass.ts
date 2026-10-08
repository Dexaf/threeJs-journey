import { InstancedMesh, Vector3, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
export async function createGrass() {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/other/grass.gltf")
    return gltf.scene;
}

export function placeGrassInstances(
    grassInstances: InstancedMesh,
    direction: Vector3,
    radius: number,
    scatter: number
) {
    if (direction.lengthSq() === 0) {
        throw new Error('Grass direction cannot be a zero-length vector.');
    }

    const baseDirection = direction.clone().normalize();
    const referenceAxis = Math.abs(baseDirection.y) < 0.999
        ? new Vector3(0, 1, 0)
        : new Vector3(1, 0, 0);
    const tangent = new Vector3()
        .crossVectors(baseDirection, referenceAxis)
        .normalize();
    const bitangent = new Vector3()
        .crossVectors(baseDirection, tangent)
        .normalize();
    const surfaceDirection = new Vector3();
    const instance = new Object3D();
    const grassUp = new Vector3(0, 1, 0);

    for (let i = 0; i < grassInstances.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distanceFromCenter = Math.sqrt(Math.random()) * scatter;

        surfaceDirection
            .copy(baseDirection)
            .multiplyScalar(radius)
            .addScaledVector(tangent, Math.cos(angle) * distanceFromCenter)
            .addScaledVector(bitangent, Math.sin(angle) * distanceFromCenter)
            .normalize();

        instance.position.copy(surfaceDirection).multiplyScalar(radius);
        instance.quaternion.setFromUnitVectors(grassUp, surfaceDirection);
        const rnd = Math.random() * Math.PI * 2;
        instance.rotateY(rnd);
        instance.scale.setScalar(1 + rnd * 0.2)
        instance.updateMatrix();
        grassInstances.setMatrixAt(i, instance.matrix);
    }

    grassInstances.instanceMatrix.needsUpdate = true;
    grassInstances.computeBoundingSphere();
}