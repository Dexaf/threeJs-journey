precision mediump float;

uniform vec3 u_insideColor;
uniform vec3 u_outsideColor;

varying float v_distanceFromCenter;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float distanceFromCenter = length(gl_PointCoord - center);
    distanceFromCenter *= 2.;
    // we need this to get alpha of a sphere (near to 1 when we are near to the center)
    float revDistanceFromCenter = 1. - distanceFromCenter;
    revDistanceFromCenter = pow(revDistanceFromCenter, 10.);

    vec3 usedColor = mix(u_insideColor, u_outsideColor, v_distanceFromCenter + 0.05);
    gl_FragColor = vec4(usedColor, revDistanceFromCenter);
    #include <colorspace_fragment>
}