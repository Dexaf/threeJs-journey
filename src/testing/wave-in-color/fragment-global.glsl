precision mediump float;

uniform vec2 u_screenSize;
uniform float u_time;

varying vec2 v_uv;

//SECTION - UTILS
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com
/*
* get random value from 0 to 1 using position
*/
float getRandom(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
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
//!SECTION - UTILS

void main() {
    //fragPositionInScreenNormalized
    vec2 fPosNorm = gl_FragCoord.xy / u_screenSize.xy;

    float noise = getNoise(fPosNorm * 10. + u_time);

    float edge = 
        // bring to half the screen
        0.5 + 
        // move horizontally with time
        (sin(u_time) * 0.1) + 
        // create wave by altering horizontal depending on Y position
        (sin(fPosNorm.y * 10. + noise * 5. + u_time * 10.) * 0.01);

    float progress = step(edge, fPosNorm.x);
    vec3 finalColor = mix(vec3(0., 1., 0.), vec3(0., 0., 1.), progress);
    gl_FragColor = vec4(finalColor, 1.0);
}