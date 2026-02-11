uniform float u_time;

varying vec3 v_normal;
varying vec3 v_position;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    v_position = modelPosition.xyz;

    //turn the normal with the model matrix to account for translations of model
    v_normal = (modelMatrix * vec4(normal, 0.0)).xyz;
}