import {
    MeshStandardNodeMaterial,
    RepeatWrapping,
    TextureLoader,
    WebGPURenderer,
} from "three/webgpu";
import {
    color,
    linearDepth,
    viewportLinearDepth,
    sub,
    smoothstep,
    normalLocal,
    positionLocal,
    time,
    sin,
    uv,
    texture,
    screenUV,
    viewportSharedTexture,
    vec2,
} from 'three/tsl';

const FOAM_IN_SHALLOWNESS_CUT = 0.6;
const MAX_DEEPNESS = 0.003;
const WAVES_FREQUENCY = 10;
const WAVES_POWER = 5;
const WAVE_TIME_RATIO = -0.1;

export async function createSeaMaterial(renderer: WebGPURenderer): Promise<MeshStandardNodeMaterial> {
    const material = new MeshStandardNodeMaterial({
        name: "m_water",
        transparent: true,
        roughness: 0.5
    });
    material.depthWrite = true;

    await renderer.init();

    const waterDepth = linearDepth();
    const behindWaterDepth = viewportLinearDepth;
    const depth = behindWaterDepth.sub(waterDepth);
    //shallow 0 ~ deep 1
    const deepness01 = depth.div(MAX_DEEPNESS).clamp(0, 1);
    //deep 0 ~ shallow 1
    const shallowness01 = sub(1, deepness01);

    // NOTE: this is not how much foam in the whole surface BUT when foam start depending on how shallow the water is
    const foamMask = smoothstep(FOAM_IN_SHALLOWNESS_CUT, 1, shallowness01);

    const textureLoader = new TextureLoader();
    const noiseTxt = await textureLoader.loadAsync("/assets/textures/noise/water-maps/0001.png");
    noiseTxt.wrapS = RepeatWrapping;
    noiseTxt.wrapT = RepeatWrapping;
    noiseTxt.anisotropy = 2;
    const zoomedUv = uv().sub(0.5).mul(0.75).add(0.5);
    const noise = texture(noiseTxt, zoomedUv).r;

    const waveToShoreMask = sin(
        //move time from deepness to shallowness
        time.mul(WAVE_TIME_RATIO).add(shallowness01, noise)
            //cut the time into pieces to form waves
            .mul(WAVES_FREQUENCY)
    )
        //bring sin back from 0 to 1
        .mul(0.5).add(0.5)
        //make peaks narrowers to distantiate waves
        .pow(WAVES_POWER)
        //smoothen the start of the wave and cut end so it's "solid"
        .smoothstep(0.2, 0.5)
        //mask waves only in foam mask
        .mul(foamMask);

    //SECTION - COLORS
    const shallowWaterColor = color("#6cc7ff");
    const normalWaterColor = color("#2fafff");
    const darkSeaColor = color("#1e7cee");
    const wavesColor = color("#b0e1ff");

    //apply dark color on deep point
    material.colorNode = deepness01.mix(
        normalWaterColor,
        darkSeaColor,
    );
    material.colorNode = foamMask.mix(
        material.colorNode,
        shallowWaterColor,
    );
    //apply wave to shore in shallow points
    material.colorNode = waveToShoreMask.mix(
        material.colorNode,
        wavesColor
    );

    const distortionColor = viewportSharedTexture(
        screenUV.add(
            vec2(
                sin(
                    //move time from deepness to shallowness
                    time.mul(-1).add(uv().y.mul(50))
                ).mul(0.001),
                sin(
                    //move time from deepness to shallowness
                    time.mul(3).add(uv().y.mul(100))
                ).mul(0.001)
            )
        )
    ).b;
    material.colorNode = material.colorNode.mul(distortionColor);
    //!SECTION - COLORS

    //bump sea with noise
    material.positionNode = positionLocal.add(
        normalLocal.mul(
            //0...1...0~
            sin(
                time.add(
                    uv().y.mul(100)
                )
            ).mul(0.5).add(0.5),
            //max height
            0.035
        )
    );
    return material;
}