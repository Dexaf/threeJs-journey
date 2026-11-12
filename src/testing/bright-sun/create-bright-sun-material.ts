import { add, float, normalLocal, positionLocal, sin, texture, time, uv, vec2 } from "three/tsl";
import { AdditiveBlending, BackSide, Color, ConstNode, DoubleSide, FrontSide, MeshStandardNodeMaterial, Texture } from "three/webgpu";



export function createBrightSunMaterial(color: ConstNode<"color", Color>, noiseTexture: Texture<HTMLImageElement>, wobbleStrength: number) {
    const material = new MeshStandardNodeMaterial({
        transparent: true,
        side: BackSide
    });
    material.depthTest = false;
    material.depthWrite = false;

    const zoomedUv = uv().sub(0.5).mul(0.5).add(0.5)
    const customUv = vec2(
        zoomedUv.x,
        zoomedUv.y.add(time.mul(0.1)),
    )
    const noiseBump = texture(noiseTexture, customUv).r;

    //vertex
    material.positionNode = positionLocal.add(normalLocal.mul(noiseBump, 0.1, wobbleStrength));

    //fragment
    material.colorNode = color;
    material.emissiveNode = color.mul(sin(time.mul(2)).mul(0.1).add(1));
    material.opacityNode = float(0.5);
    return material;
}