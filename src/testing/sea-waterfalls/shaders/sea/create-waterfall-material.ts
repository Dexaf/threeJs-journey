import { color, mul, normalLocal, PI, positionLocal, screenUV, sin, sub, texture, time, uv, vec2, viewportSharedTexture } from "three/tsl";
import {
    DoubleSide,
    MeshStandardNodeMaterial,
    RepeatWrapping,
    TextureLoader,
    WebGPURenderer,
} from "three/webgpu";

export async function createWaterfallMaterial(renderer: WebGPURenderer): Promise<MeshStandardNodeMaterial> {
    const material = new MeshStandardNodeMaterial({
        name: "m_waterfall",
        transparent: true,
        side: DoubleSide,
        roughness: 0.7
    });
    material.depthTest = false;

    await renderer.init();

    const textureLoader = new TextureLoader();
    const noiseTxt = await textureLoader.loadAsync("/assets/textures/noise/water-maps/waterfall-2.jpg");
    noiseTxt.wrapS = RepeatWrapping;
    noiseTxt.wrapT = RepeatWrapping;
    noiseTxt.anisotropy = 2;

    const uvX = uv().x
        .mul(1.2);
    const uvY = uv().y
        .add(time.mul(-0.25));
    const shiftedUv = vec2(
        uvX,
        uvY,
    );
    const noiseTxtSample = texture(noiseTxt, shiftedUv).pow(0.5);

    const denseWaterColor = color("#1e7cee");
    const normalWaterColor = color("#2fafff");
    const foamColor = color("#caebff");

    //SECTION - dense water section
    material.colorNode = uv().y.smoothstep(0.25, 0.75).mix(
        denseWaterColor,
        normalWaterColor
    );
    //!SECTION - dense water section

    //SECTION - thinner water section
    material.colorNode = uv().y.smoothstep(0.5, 1).mix(
        material.colorNode,
        foamColor
    );
    //!SECTION - thinner water section

    //SECTION - spreaded water at corners
    const sprdWaterCornerMask =
        //res: 1..0..1 (where 1 is at borders)
        sin(
            //res: 0~1
            uv().x
                //res: 0~6...       
                .mul(PI.mul(2))
                //res: 1.6~7.8...   
                .add(PI.mul(0.5))
        )
            //re-normalize in 0~1
            .mul(0.5).add(0.5)
            //spread more when reaching bottom
            .mul(uv().y.smoothstep(0.2, 0.8));
    //!SECTION - spreaded water at corners
    //SECTION - shine on curve
    const HEIGHT_CEIL = 0.05;
    const HEIGHT_FLOOR = 0.4;
    const shineOnDropMask =
        //use sin to turn into gradient 0...1...0
        sin(
            //goes from HEIGHT_CEIL (0) to HEIGHT_FLOOR (1) using smoothstep 
            //and then after HEIGHT_FLOOR go back to 0
            sub(
                uv().y.smoothstep(HEIGHT_CEIL, HEIGHT_FLOOR),
                uv().y.step(HEIGHT_FLOOR)
            ).mul(PI)
        ).pow(2);
    //!SECTION - shine on curve

    const thinWaterMask = sprdWaterCornerMask.add(shineOnDropMask).mul(noiseTxtSample.r);

    //combine mask used to show thin water
    material.colorNode = thinWaterMask.mix(
        material.colorNode,
        foamColor
    );

    //spread waterfall at bottom with vertex displacement
    material.positionNode = positionLocal.add(
        normalLocal.mul(
            sin(time.mul(2)).mul(0.5),
            uv().y,
            0.12,
            noiseTxtSample.r
        )
    );

    material.opacityNode = uv().y.oneMinus().smoothstep(0, 0.6);

    return material;
}

export async function createWaterfallMaterialV2(renderer: WebGPURenderer): Promise<MeshStandardNodeMaterial> {
    const material = new MeshStandardNodeMaterial({
        name: "m_waterfall",
        transparent: true,
        side: DoubleSide,
        roughness: 0.7
    });

    await renderer.init();

    const textureLoader = new TextureLoader();
    const noiseTxt = await textureLoader.loadAsync("/assets/textures/noise/water-maps/waterfall-2.jpg");
    noiseTxt.wrapS = RepeatWrapping;
    noiseTxt.wrapT = RepeatWrapping;
    noiseTxt.anisotropy = 2;

    const uvX = uv().x
        .mul(1.2);
    const uvY = uv().y
        .add(time.mul(-0.25));
    const shiftedUv = vec2(
        uvX,
        uvY,
    );
    const noiseTxtSample = texture(noiseTxt, shiftedUv).pow(0.5);

    const denseWaterColor = color("#1e7cee");
    const normalWaterColor = color("#2fafff");
    const foamColor = color("#caebff");

    //SECTION - dense water section
    material.colorNode = uv().y.smoothstep(0.25, 0.75).mix(
        denseWaterColor,
        normalWaterColor
    );
    //!SECTION - dense water section

    //SECTION - thinner water section
    material.colorNode = uv().y.smoothstep(0.5, 1).mix(
        material.colorNode,
        foamColor
    );
    //!SECTION - thinner water section

    //SECTION - spreaded water at corners
    const sprdWaterCornerMask =
        //res: 1..0..1 (where 1 is at borders)
        sin(
            //res: 0~1
            uv().x
                //res: 0~6...       
                .mul(PI.mul(2))
                //res: 1.6~7.8...   
                .add(PI.mul(0.5))
        )
            //re-normalize in 0~1
            .mul(0.5).add(0.5)
            //spread more when reaching bottom
            .mul(uv().y.smoothstep(0.2, 0.8));
    //!SECTION - spreaded water at corners
    //SECTION - shine on curve
    const HEIGHT_CEIL = 0.05;
    const HEIGHT_FLOOR = 0.4;
    const shineOnDropMask =
        //use sin to turn into gradient 0...1...0
        sin(
            //goes from HEIGHT_CEIL (0) to HEIGHT_FLOOR (1) using smoothstep 
            //and then after HEIGHT_FLOOR go back to 0
            sub(
                uv().y.smoothstep(HEIGHT_CEIL, HEIGHT_FLOOR),
                uv().y.step(HEIGHT_FLOOR)
            ).mul(PI)
        ).pow(2);
    //!SECTION - shine on curve

    const thinWaterMask = sprdWaterCornerMask.add(shineOnDropMask).mul(noiseTxtSample.r);

    //combine mask used to show thin water
    material.colorNode = thinWaterMask.mix(
        material.colorNode,
        foamColor
    );

    const opacity = uv().y.oneMinus().smoothstep(0, 0.8);
    const distortionColor = viewportSharedTexture(
        screenUV.add(
            vec2(
                noiseTxtSample.r.mul(0.01),
                noiseTxtSample.r.mul(0.02)
            )
        )
    ).rgb;
    material.colorNode = material.colorNode.add(
        mul(opacity.oneMinus(), distortionColor)
    );

    //spread waterfall at bottom with vertex displacement
    material.positionNode = positionLocal.add(
        normalLocal.mul(
            sin(time.mul(2)).mul(0.5),
            uv().y,
            0.12,
            noiseTxtSample.r
        )
    );

    material.opacityNode = opacity;

    return material;
}