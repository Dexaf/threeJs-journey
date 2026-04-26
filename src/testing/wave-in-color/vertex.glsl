uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform vec2 u_size;

attribute vec3 position;
attribute vec2 uv;

varying vec2 v_uv; 
varying vec2 v_localPosNormalized;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;
    v_uv = uv;
    v_localPosNormalized = position.xy / u_size;
    v_localPosNormalized += 0.5;
}