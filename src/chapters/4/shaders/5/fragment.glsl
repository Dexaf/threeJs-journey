precision mediump float;

uniform float u_time;
uniform float u_verticalSmokeSpeedRatio;
uniform float u_smokeAlphaHardThreshold;
uniform float u_smokeEdgeDistanceCutRatio;
uniform sampler2D u_perlinNoiseTexture;

varying vec2 v_uv;

void main() {
    //clone the varying to change it
    vec2 uv = v_uv;
    uv.x *= 0.5;
    uv.y *= 0.3;
    uv.y -= u_time * u_verticalSmokeSpeedRatio;

    float perlinNoiseChannel = texture(u_perlinNoiseTexture, uv).r;
    //Hard thresholding perche' i valori grigi ci impediscono una trasparenza vera
    perlinNoiseChannel = smoothstep(u_smokeAlphaHardThreshold, 1., perlinNoiseChannel);
    //riduciamo il valore ai lati per evitare il taglio della texture
    float distanceFromMiddle = distance(vec2(0.5), v_uv);
    perlinNoiseChannel -= distanceFromMiddle * u_smokeEdgeDistanceCutRatio;

    gl_FragColor = vec4(vec3(1.), perlinNoiseChannel);

    // The tonemapping_fragment chunk will add support to the toneMapping. 
    // We are not going to set a toneMapping, but it’s good practice to anticipate it.
    #include <tonemapping_fragment>

    // The colorspace_fragment chunk will convert the colors 
    // in order to comply with the renderer color space setting.
    #include <colorspace_fragment>
}