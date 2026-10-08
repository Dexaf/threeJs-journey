import { color, mul, PI, sin, sub, texture, time, uv, vec2, } from "three/tsl";
import {
    FrontSide,
    MeshStandardNodeMaterial,
    RepeatWrapping,
    TextureLoader,
    WebGPURenderer,
} from "three/webgpu";

const TIME_RATIO = 0.6;
export async function createWaterfallBasisMaterial(renderer: WebGPURenderer): Promise<MeshStandardNodeMaterial> {
    const material = new MeshStandardNodeMaterial({
        name: "m_water_surface",
        transparent: true,
        side: FrontSide
    });
    material.depthTest = false;

    await renderer.init();

    //SECTION - NOISE LOAD
    const textureLoader = new TextureLoader();
    const noiseATxt = await textureLoader
        .loadAsync("/assets/textures/noise/water-maps/waterfall-2.jpg");
    noiseATxt.wrapS = RepeatWrapping;
    noiseATxt.wrapT = RepeatWrapping;
    noiseATxt.anisotropy = 2;
    const shiftedUvA = vec2(
        uv().x.add(
            sin(
                mul(
                    5,
                    PI,
                    uv().y.pow(2).mul(5).mod(1),
                )
            ).mul(0.01).add(0.01)
        ),
        uv().y.pow(0.5).add(time.mul(TIME_RATIO)),
    ).sub(0.5).mul(2).add(0.5);
    const noise = texture(noiseATxt, shiftedUvA);
    //!SECTION - NOISE LOAD

    const reversedY = sub(1, uv().y);
    const gradientMask = noise
        .mul(reversedY.smoothstep(0, 0.5))
        .mul(uv().y.smoothstep(0, 0.75));

    //SECTION - COLORS
    const foamColor = color("#6bc6ff");
    const lowFoamColor = color("#1e7cee");
    material.colorNode = uv().y.pow(2).mix(
        foamColor,
        lowFoamColor
    );

    material.opacityNode = gradientMask;
    //!SECTION - COLORS

    return material;
}