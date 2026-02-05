uniform float u_time;

varying vec2 v_Uv;
varying float v_time;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    v_Uv = uv;
    v_time = u_time;
}