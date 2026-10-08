import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { type WebGPURenderer } from "three/webgpu";

export async function createBrachioslug(renderer: WebGPURenderer): Promise<GLTF> {
    await renderer.init();

    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/other/Brachioslug/sm_brachioslug.gltf");

    return gltf;
}
