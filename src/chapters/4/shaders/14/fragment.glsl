precision mediump float;

varying vec2 v_uv;
varying float v_height;

void main() {
    // cosi perdiamo lo shading visto che interveniamo sul colore finale
    // csm_FragColor.rgb = vec3(0.3, 0., 0.05);

    csm_Metalness = smoothstep(0.5, 1., v_height);
    csm_Roughness = 1. - v_height;

    //questa invece e' solo la albedo
    vec3 color = mix(vec3(0., 0., 1.), vec3(0., 1., 0.), v_height);
    csm_DiffuseColor.rgb = vec3(color);
}