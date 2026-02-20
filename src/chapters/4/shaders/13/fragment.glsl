precision mediump float;

varying vec3 v_color;

void main() {
    vec2 l_uv = gl_PointCoord;

    float sphereAlpha = distance(vec2(0.5), l_uv);
    sphereAlpha = 1. - step(0.5, sphereAlpha);

    gl_FragColor = vec4(v_color, sphereAlpha);
}