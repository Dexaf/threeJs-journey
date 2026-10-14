import { instancedBufferAttribute, float, uv, color, add } from "three/tsl";
import { AdditiveBlending, InstancedBufferAttribute, PointsNodeMaterial } from "three/webgpu";

export async function createParticleHoloMaterial(
    positionsAttribute: InstancedBufferAttribute,
    sizesAttribute: InstancedBufferAttribute,
    lifetimesPercAttribute: InstancedBufferAttribute
) {
    const holoMaterial = new PointsNodeMaterial({
        positionNode: instancedBufferAttribute(positionsAttribute),
        sizeNode: instancedBufferAttribute(sizesAttribute),
        sizeAttenuation: true,
        transparent: true,
        blending: AdditiveBlending
    });
    holoMaterial.depthTest = true;
    holoMaterial.depthWrite = false;


    const sizeCut = 0.2;
    //calc square mask by side distance from center, then smooth it to have a gradient outside square
    const squareYMask = float(0.5).distance(uv().y).mul(2).smoothstep(sizeCut, sizeCut + 0.2);
    const squareXMask = float(0.5).distance(uv().x).mul(2).smoothstep(sizeCut, sizeCut + 0.2);
    const squareMask = add(squareXMask, squareYMask);

    const holoColorIntense = color("#a8fffc");
    const holoColor = color("#00d9ff");

    holoMaterial.colorNode = squareMask.step(0.1).pow2().mix(
        holoColorIntense,
        holoColor
    );

    const lifetimePercAttribute =
        instancedBufferAttribute(lifetimesPercAttribute, 'float').toFloat();

    const fadeIn = lifetimePercAttribute.oneMinus().smoothstep(0, 0.2);
    const fadeOut = lifetimePercAttribute.smoothstep(0, 0.2);

    holoMaterial.opacityNode = squareMask.oneMinus().mul(fadeIn).mul(fadeOut);

    return holoMaterial;
}