import { color } from "three/src/nodes/TSL.js";
import { add, cameraPosition, normalLocal, normalWorld, positionLocal, positionWorld, sin, time } from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";

export async function createCoreMaterial() {

    const material = new MeshStandardNodeMaterial();
    const expansionRate = add(
        sin(time.mul(0.5))
            .mul(0.4).add(0.4).pow(3),
        sin(time.mul(10))
            .mul(0.015).add(0.015)
    );

    material.positionNode = positionLocal.add(normalLocal.mul(add(1, expansionRate)));

    //fresnel
    const fresnelMask = cameraPosition.sub(positionWorld).normalize()
        .dot(normalWorld).abs()
        .oneMinus()
        .smoothstep(0., expansionRate.add(0.4));


    material.colorNode = fresnelMask.mix(
        color("#fff"),
        color("#00f7ff")
    );

    material.emissiveNode = fresnelMask.mix(
        color("#fff"),
        color("#00f7ff")
    );

    return material;
}