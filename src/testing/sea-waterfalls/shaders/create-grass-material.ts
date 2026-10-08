import { add, color, positionLocal, positionWorld, sin, texture, time, uv, vec3 } from "three/tsl";
import { DoubleSide, MeshStandardNodeMaterial, TextureLoader } from "three/webgpu";

const MAX_MOVEMENT_DELTA = 0.01;
const TIME_RATIO = 1.5;

export async function createGrassMaterial() {
    const material = new MeshStandardNodeMaterial({
        side: DoubleSide
    });

    const textureLoader = new TextureLoader();
    const leafMask = await textureLoader.loadAsync("/assets/3d-models/other/leaf-mask.webp")

    const positionBasRnd = add(positionWorld.y, positionWorld.x, positionWorld.z).mul(1000).mod(1);

    material.positionNode = vec3(
        positionLocal.x,
        positionLocal.y,
        positionLocal.z.add(
            sin(time.mul(TIME_RATIO, positionBasRnd).add(positionBasRnd))
                //max oscillation
                .mul(MAX_MOVEMENT_DELTA).add(MAX_MOVEMENT_DELTA)
                //dependent on height of leaf to move only the tip
                .mul(uv().y.step(0.8))
        )
    );

    material.maskNode = texture(leafMask, uv()).r.greaterThan(0.5);
    const lightGreen = color("#77ddff");
    const darkGreen = color("#3b83ff");

    material.colorNode = uv().y.oneMinus().smoothstep(0, 0.7).mix(
        lightGreen,
        darkGreen
    );
    return material;
}