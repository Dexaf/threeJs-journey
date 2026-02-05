precision mediump float;

uniform vec3 u_shallowColor;
uniform vec3 u_deepColor;

varying float v_fragHeight;

void main() {
    #include <colorspace_fragment>

    vec3 fragColor = mix(u_deepColor, u_shallowColor, v_fragHeight);

    gl_FragColor = vec4(fragColor, 1.);
}