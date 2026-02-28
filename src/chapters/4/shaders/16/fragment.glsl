varying float v_elevation;
varying vec2 v_2DPos;

uniform vec3 u_grass;
uniform vec3 u_snow;
uniform vec3 u_sand;
uniform vec3 u_water;
uniform vec3 u_waterDeep;
uniform vec3 u_rock;

float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}

void main() {
    vec3 finalColor = vec3(0.);

    float waterAlpha = smoothstep(0., 0.05, v_elevation);
    finalColor = mix(u_water, u_waterDeep, waterAlpha);

    float sandAlpha = step(0.1, v_elevation);
    finalColor = mix(finalColor, u_sand, sandAlpha);

    float grassAlpha = step(0.3, v_elevation);
    finalColor = mix(finalColor, u_grass, grassAlpha);

    float rockAlpha = step(0.8, v_elevation);
    finalColor = mix(finalColor, u_rock, rockAlpha);

    float snowNoise = noise2D(v_2DPos * 15.) * 0.1;
    float snowThreshold = 1.0;
    snowThreshold -= snowNoise;
    float snowAlpha = step(snowThreshold, v_elevation);

    finalColor = mix(finalColor, u_snow, snowAlpha);

    csm_DiffuseColor.rgb = vec3(finalColor);
}