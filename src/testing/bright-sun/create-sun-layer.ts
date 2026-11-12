import { Mesh, Object3D } from "three";
import { createBrightSunMaterial } from "./create-bright-sun-material";
import type { Color, ConstNode, Texture } from "three/webgpu";

export function createSunLayer(sun: Object3D, size: number, color: ConstNode<"color", Color>, noiseTexture: Texture<HTMLImageElement>, wobbleStrength: number) {
    const sizeInRatio = sun.scale.x * size;
    sun.scale.set(sizeInRatio, sizeInRatio, sizeInRatio);
    sun.traverse(o => {
        if (o instanceof Mesh) {
            o.material = createBrightSunMaterial(color, noiseTexture, wobbleStrength);
        }
    })

    return sun;
}
