uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float u_time;

attribute vec3 position;
attribute float a_random;

varying float v_height;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float height = sin(modelPosition.z * 3.0 + a_random + u_time);
    modelPosition.y += height * 0.1;
    v_height = height / 2.0 + 0.5;
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;
}