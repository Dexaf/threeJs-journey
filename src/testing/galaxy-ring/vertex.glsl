uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;
    v_uv = uv;
    v_normal = normalize(mat3(modelMatrix) * normal);
    v_position = modelPosition.xyz;
}