precision mediump float;

uniform float u_tailProgress;
uniform float u_headProgress;

varying vec2 v_uv;

void main() {
    vec3 color = vec3(0.17, 0.64, 0.91);

    //SECTION - OPACITY ALONG X
    float tailHideGradient = 1.0 - smoothstep(v_uv.x - 0.15, v_uv.x, u_tailProgress);
    float headShow = step(v_uv.x, u_headProgress);
    float show = tailHideGradient * step(tailHideGradient, headShow);
    //INCREASE IN COLOR WHEN NEAR HEAD
    float headHighlightRatio = 1.0 + smoothstep(u_headProgress - 0.2, u_headProgress, v_uv.x);
    //!SECTION - OPACITY ALONG X

    vec3 finalColor = color * headHighlightRatio;
    gl_FragColor = vec4(finalColor, show);
}