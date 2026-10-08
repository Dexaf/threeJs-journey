import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { type WebGPURenderer } from "three/webgpu";

export async function createChuparoo(renderer: WebGPURenderer): Promise<GLTF>{
    await renderer.init();

    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync("/assets/3d-models/other/Chuparoo/sm_chuparoo.gltf");
    
    return gltf
}