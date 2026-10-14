import { add, cameraPosition, div, mul, normalWorld, positionWorld, sin, time, vertexColor } from "three/tsl";
import { AdditiveBlending, DoubleSide, MeshStandardNodeMaterial, } from "three/webgpu";

const STRIPES = 4;
const STRIPES_TIME_RATIO = 0.2;
const PULES_TIME_RATIO = 3;

export async function createHoloMaterial() {
    const material = new MeshStandardNodeMaterial({
        transparent: true,
        opacity: 0.3,
        blending: AdditiveBlending,
        side: DoubleSide
    });
    material.depthWrite = false;
    material.depthTest = true;

    //fresnel
    const fresnelMask = cameraPosition.sub(positionWorld).normalize()
        .dot(normalWorld).abs()
        .oneMinus()
        .smoothstep(0.5, 0.7);

    //small stripes
    const weakStripesMask = positionWorld.y.add(time.mul(-STRIPES_TIME_RATIO))
        .mul(STRIPES).fract().step(0.5);
    material.colorNode = weakStripesMask.mix(
        vertexColor().mul(add(0.75, fresnelMask)),
        vertexColor().mul(add(1, fresnelMask))
    )

    //big stripes
    const lastStripePerc = div(1, mul(STRIPES, 2)).mul(2).oneMinus();
    const strongStripesMask = positionWorld.y.add(time.mul(-STRIPES_TIME_RATIO))
        //highlight one stripe every batch
        .mul(STRIPES).mod(STRIPES).div(STRIPES)
        .fract().smoothstep(
            lastStripePerc,
            1
        )
        .pow(2);
    material.colorNode = strongStripesMask.mix(
        material.colorNode,
        material.colorNode.mul(
            add(1,
                sin(mul(time, PULES_TIME_RATIO)).mul(0.25), 0.5
            ).pow(2)
        )
    )

    //highlight in top of big stripes
    material.colorNode = strongStripesMask.step(0.99).mix(
        material.colorNode,
        material.colorNode.mul(1.1),
    )

    return material;
}