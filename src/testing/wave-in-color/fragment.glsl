precision mediump float;

uniform float u_time;
uniform float u_progress;
uniform vec3 u_currentColor;
uniform vec3 u_targetColor;

varying vec2 v_uv;
varying vec2 v_localPosNormalized;

const float PI = 3.14159265359;
const float DEG45 = PI * 0.25;

//SECTION - UTILS
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com
/**
* get random value from 0 to 1 using position
*/
float getRandom(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
/**
* get noise value
*/
float getNoise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = getRandom(i);
    float b = getRandom(i + vec2(1.0, 0.0));
    float c = getRandom(i + vec2(0.0, 1.0));
    float d = getRandom(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}

/**
* rotate a position by given rads
*/
vec2 rotatePos(vec2 pos, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c);
}
//!SECTION - UTILS

void main() {
    float noise = getNoise(v_uv * 10. + u_time);
    vec2 rotatedPos = rotatePos(v_localPosNormalized, DEG45);

    float monoWave = cos(rotatedPos.y * PI * 2. + 2.) * 0.1;
    float pentaWave = cos(rotatedPos.y * PI * 10. + 2.) * 0.1;
    float finalWave = 8. * (monoWave * pentaWave);

    float finalProgress = 
        // move horizontally with time
    u_progress +
        finalWave +
        // create wave by altering horizontal depending on Y position
        (sin(rotatedPos.y * 10. + noise * 10. + u_time * 10.) * 0.01);

    /** NOTE
    * v_localPosNormalized had values from 0 to 1 but after rotation the range changes.
    * so we re-normalize the progress axis
    */
    float progressAxisNormalized = rotatedPos.x * 0.5 + 0.5;
    float colorMixOnProgress = step(progressAxisNormalized, finalProgress);

    float clearTargetSmoothStep = smoothstep(finalProgress - 0.05, finalProgress, progressAxisNormalized);
    vec3 finalTargetColor = mix(u_targetColor, u_targetColor * 2., clearTargetSmoothStep);

    vec3 finalColor = mix(u_currentColor, finalTargetColor, colorMixOnProgress);
    gl_FragColor = vec4(finalColor, u_progress + 0.25 + (1. - colorMixOnProgress));
}