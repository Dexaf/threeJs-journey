precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_color;

void main() {
    float textureMask = texture(u_texture, gl_PointCoord).r;

    gl_FragColor = vec4(vec3(u_color), textureMask);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}