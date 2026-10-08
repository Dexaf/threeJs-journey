precision mediump float;

varying vec2 v_uv;
uniform float u_time;

void main() {
    vec3 color = vec3(1);
    float t = sin(v_uv.x);
    color = mix(color, vec3(0.), t);
    gl_FragColor = vec4(color, 1.0);
}