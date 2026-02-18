varying vec3 v_color;

void main() {
    vec2 uv = gl_PointCoord;
  
    float fragDistanceFromCenter = length(vec2(.5) - uv);
    /* 
        discard will prevent the fragment from being drawn entirely 
        without even relying on transparency.
        It’s as if there is nothing there 
        even though the geometry says otherwise 
    */
    if(fragDistanceFromCenter > 0.5)
        discard;

    vec3 l_color = v_color;

    gl_FragColor = vec4(l_color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}