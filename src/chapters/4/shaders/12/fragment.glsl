precision mediump float;

varying vec3 v_color;

void main() {
    vec2 l_uv = gl_PointCoord;
    float circleAlphaMask = distance(vec2(0.5), l_uv);
    //questo calcolo ci permette di invertire esponenzialmente
    //i valori della maschera.
    //al primo calcolo abbiamo ~0.01 vicino al centro e 0.5 agli estremi
    //invece, dopo aver diviso 0.05 per la maschera, abbiamo 
    //valori altissimi vicino al centro, che calano esponenzialmente
    //mentre ci allontaniamo
    circleAlphaMask = 0.05 / circleAlphaMask - 0.1;
    vec3 finalColor = v_color;

    gl_FragColor = vec4(finalColor, circleAlphaMask);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}