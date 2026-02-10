uniform float u_maxExplosionSize;
uniform float u_size;
uniform vec2 u_resolution;
uniform float u_progress;

attribute float a_sizeMultiplier;

/*
    value: the value you want to remap
    originMin and originMax: the start and end of the original range (the part that you want to transform into another range)
    destinationMin and destinationMax: the start and end of the destination range 
*/
float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax) {
    return destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin);
}

float easeOutExpo(float x, float ceilValue) {
    return sqrt(ceilValue - pow(x - ceilValue, 2.));
}

float easeInQuad(float x) {
    return x * x;
}

void main() {
    //we could multiply progress by some randomness to make it more natural
    //i wont

    // Exploding from 0 to 0.2 then always at least 1
    float explodingProgress = remap(u_progress, 0.0, 0.1, 0.0, 1.0);
    // we cap the size with u_maxExplosionSize
    explodingProgress = min(explodingProgress, u_maxExplosionSize);
    // then slow down when reaching max range
    explodingProgress = easeOutExpo(explodingProgress, u_maxExplosionSize);
    //we just need to multiply the position to make it go along it's normal direction
    vec3 localPosition = position * explodingProgress;

    // At beign always 0, then start to linearly go to 1
    float fallingProgress = remap(u_progress, 0.0, 0.1, 0.0, 1.0);
    localPosition.y -= easeInQuad(fallingProgress) * 0.01;

    vec4 modelPosition = modelMatrix * vec4(localPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    //size
    float sizeOpeningProgress = remap(u_progress, 0.0, 0.1, 0.0, 1.0);
    float sizeClosingProgress = remap(u_progress, 0.1, 1.0, 1.0, 0.0);
    float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
    sizeProgress = clamp(sizeProgress, 0.0, 1.0);

    //twinkling
    float twinklingProgress = remap(u_progress, 0.1, 0.8, 0., 1.);
    twinklingProgress = easeOutExpo(twinklingProgress, 1.);
    float twinklingSize = sin(twinklingProgress * 30.) / 8. + 1.;

    gl_PointSize = u_size * a_sizeMultiplier * sizeProgress * twinklingSize * u_resolution.y;
    //make size inverse to distance from view for perspective
    gl_PointSize *= 1.0 / -viewPosition.z;
}