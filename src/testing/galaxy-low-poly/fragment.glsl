precision mediump float;

varying vec2 v_uv;
varying float v_height;
varying float v_noise;

const vec2 CENTER = vec2(0.5, 0.5);
const vec3 g_sagBlue = vec3(0.215, 0.384, 1.0);
const vec3 g_sagGreen = vec3(0.004, 0.992, 0.5803);

void main() {
    float d = distance(v_uv, CENTER) / 0.5;
    float smoothD = smoothstep(0., 1.1, d);

    float colorMap = clamp(v_height, 0.8, 1.);
    colorMap = smoothstep(0.4, 1.0, colorMap);
    vec3 color = mix(g_sagBlue, g_sagGreen, colorMap * v_noise);

    float centerMask = pow(smoothstep(0.1, 0., smoothD), 0.7);
    color = mix(color, vec3(1.), centerMask);

    gl_FragColor = vec4(color, v_height);
}