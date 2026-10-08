precision mediump float;

uniform vec3 u_camPosition;

varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_normal;

void main() {
    vec3 viewDirection = normalize(v_position - u_camPosition);
    vec3 l_normal = normalize(v_normal);
    //0 perpendicular 1 parallel
    float incidence = -dot(viewDirection, l_normal);
    incidence = pow(incidence, 5.);
    incidence = smoothstep(-0.5, 1., incidence);

    vec3 color = vec3(0.0, 0.75, 1.0);
    color = mix(color, vec3(1.), incidence);

    gl_FragColor = vec4(color, incidence + 0.2);
}