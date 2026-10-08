// Forma della testa
uniform float u_headSize;
uniform float u_headFalloff;

// Forma della coda
uniform float u_tailLength;
uniform float u_tailThickness;

/*
 * Moltiplicatore dello spessore vicino alla testa.
 *
 * 1.0 = spessore uniforme
 * 2.0 = doppio spessore vicino alla testa
 */
uniform float u_tailHeadThickness;

/*
 * Controlla quanto rapidamente lo spessore aggiuntivo
 * sparisce allontanandosi dalla testa.
 */
uniform float u_tailTaperFalloff;

// Decadimento trasversale, dai bordi verso il centro.
uniform float u_tailEdgeFalloff;

// Decadimento longitudinale, dalla testa alla fine.
uniform float u_tailLengthFalloff;

// Intensità separate
uniform float u_headIntensity;
uniform float u_tailIntensity;
uniform float u_opacity;

varying float v_fogTailAlpha;
varying float v_fogHeadAlpha;
varying vec2 v_movement;
varying float v_spriteExtent;
varying float v_random;

void main() {
    vec2 mappedUv = vec2(
        gl_PointCoord.x * 2.0 - 1.0,
        1.0 - gl_PointCoord.y * 2.0
    );

    /*
     * Compensa l'aumento di gl_PointSize.
     * Le dimensioni della forma restano espresse
     * nelle stesse unità logiche.
     */
    mappedUv *= v_spriteExtent;

    vec2 headPos =
        v_movement * 0.5;

    // HEAD
    float normalizedHeadDistance =
        distance(headPos, mappedUv) /
        max(u_headSize, 0.00001);

    float headAlpha = pow(
        clamp(
            1.0 - normalizedHeadDistance,
            0.0,
            1.0
        ),
        max(u_headFalloff, 0.00001)
    );

    headAlpha *= u_headIntensity;

    // TAIL
    vec2 tailEndPos =
        headPos -
        v_movement * u_tailLength;

    vec2 headToTailVector =
        tailEndPos - headPos;

    float tailLengthSquared =
        max(
            dot(headToTailVector, headToTailVector),
            0.00001
        );

    /*
     * 0.0 = punto più vicino alla testa
     * 1.0 = punto più vicino alla fine della coda
     */
    float tailProgress =
        dot(
            mappedUv - headPos,
            headToTailVector
        ) /
        tailLengthSquared;

    tailProgress =
        clamp(tailProgress, 0.0, 1.0);

    vec2 nearestTailPoint =
        headPos +
        headToTailVector * tailProgress;

    float distanceFromTail =
        distance(
            mappedUv,
            nearestTailPoint
        );

    /*
     * Vicinanza alla testa:
     * 1 vicino alla testa, 0 alla fine.
     */
    float headProximity = pow(
        1.0 - tailProgress,
        max(u_tailTaperFalloff, 0.00001)
    );

    /*
     * Spessore interpolato:
     * alla fine vale u_tailThickness;
     * vicino alla testa viene moltiplicato
     * per u_tailHeadThickness.
     */
    float localTailThickness =
        u_tailThickness *
        mix(
            1.0,
            u_tailHeadThickness,
            headProximity
        );

    // Falloff trasversale
    float tailEdgeAlpha = pow(
        clamp(
            1.0 -
            distanceFromTail /
            max(localTailThickness, 0.00001),
            0.0,
            1.0
        ),
        max(u_tailEdgeFalloff, 0.00001)
    );

    // Falloff longitudinale
    float tailLongitudinalAlpha = pow(
        clamp(
            1.0 - tailProgress,
            0.0,
            1.0
        ),
        max(u_tailLengthFalloff, 0.00001)
    );

    float tailAlpha =
        tailEdgeAlpha *
        tailLongitudinalAlpha *
        u_tailIntensity;

    float fogAlpha = clamp(
        v_fogHeadAlpha + v_fogTailAlpha,
        0.0,
        1.0
    );

    float finalAlpha = clamp(
        (headAlpha + tailAlpha) *
        fogAlpha *
        u_opacity,
        0.0,
        1.0
    );


    gl_FragColor = vec4(
        vec3(1.),
        finalAlpha
    );

    #include <colorspace_fragment>
}