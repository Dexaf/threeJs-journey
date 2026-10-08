uniform float u_time;
uniform float u_size;
uniform vec2 u_resolution;

attribute float a_random;

// Movimento
uniform float u_acceleration;
uniform float u_maxVelocity;
uniform float u_loopDistance;
uniform float u_motionSample;

// Dimensioni della point sprite
uniform float u_tailLength;
uniform float u_tailThickness;
uniform float u_tailHeadThickness;
uniform float u_headSize;

varying float v_fogTailAlpha;
varying float v_fogHeadAlpha;
varying vec2 v_movement;
varying float v_spriteExtent;
varying float v_random;

float getMovementOffset(float time) {
    float accelerationTime =
        u_maxVelocity / max(u_acceleration, 0.00001);

    float acceleratedTime =
        min(time, accelerationTime);

    float constantVelocityTime =
        max(time - accelerationTime, 0.0);

    float accelerationDistance =
        0.5 *
        u_acceleration *
        acceleratedTime *
        acceleratedTime;

    float constantVelocityDistance =
        u_maxVelocity *
        constantVelocityTime;

    return (accelerationDistance + constantVelocityDistance) * (1. + a_random);
}

void main() {
    float currentTime = max(u_time, 0.0);
    float previousTime = max(
        currentTime - u_motionSample,
        0.0
    );

    float currentOffset =
        getMovementOffset(currentTime);

    float previousOffset =
        getMovementOffset(previousTime);

    // CURRENT POSITION
    vec3 nextPosition = position;
    nextPosition.z += currentOffset;
    nextPosition.z = mod(
        nextPosition.z,
        u_loopDistance
    );

    vec4 currModelPosition =
        modelMatrix * vec4(nextPosition, 1.0);

    vec4 currViewPosition =
        viewMatrix * currModelPosition;

    vec4 currProjPosition =
        projectionMatrix * currViewPosition;

    vec2 currScreenPos =
        currProjPosition.xy /
        currProjPosition.w;

    // PREVIOUS POSITION
    vec3 prevPos = position;
    prevPos.z += previousOffset;
    prevPos.z = mod(
        prevPos.z,
        u_loopDistance
    );

    /*
     * Corregge il wrapping senza usare if.
     * Interviene soltanto quando la differenza è circa
     * pari alla lunghezza dell'intero loop.
     */
    float wrapped =
        step(
            u_loopDistance * 0.5,
            prevPos.z - nextPosition.z
        );

    prevPos.z -= wrapped * u_loopDistance;

    vec4 prevModelPosition =
        modelMatrix * vec4(prevPos, 1.0);

    vec4 prevViewPosition =
        viewMatrix * prevModelPosition;

    vec4 prevProjPosition =
        projectionMatrix * prevViewPosition;

    vec2 prevScreenPos =
        prevProjPosition.xy /
        prevProjPosition.w;

    // MOVIMENTO PROIETTATO SULLO SCHERMO
    vec2 screenMovement =
        (currScreenPos - prevScreenPos) *
        u_resolution;

    /*
     * Fallback senza if per evitare normalize(vec2(0)).
     */
    float movementLength =
        length(screenMovement);

    vec2 fallbackDirection =
        vec2(0.0, 1.0) *
        step(movementLength, 0.00001);

    v_movement = normalize(
        screenMovement + fallbackDirection
    );

    gl_Position = currProjPosition;

    /*
     * Lo sprite deve contenere:
     * - lunghezza della coda
     * - dimensione della testa
     * - massimo spessore della coda
     */
    float maximumTailThickness =
        u_tailThickness *
        max(u_tailHeadThickness, 1.0);

    float maximumThickness =
        max(u_headSize, maximumTailThickness);

    v_spriteExtent = max(
        1.0,
        u_tailLength +
        maximumThickness +
        0.5
    );

    gl_PointSize =
        u_size *
        10.0 *
        v_spriteExtent;

    gl_PointSize *=
        1.0 / -currViewPosition.z;

    v_fogTailAlpha =
        smoothstep(0.0, 0.5, prevPos.z);

    v_fogHeadAlpha =
        smoothstep(0.0, 0.5, nextPosition.z);

    v_random = a_random;
}