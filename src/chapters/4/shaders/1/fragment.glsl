precision mediump float;

varying float v_height;

void main() {
    gl_FragColor = vec4(1.0 - v_height, 0.0, v_height, 1.0);
}