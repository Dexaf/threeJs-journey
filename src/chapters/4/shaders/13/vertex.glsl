attribute vec2 a_particleUv;
attribute vec3 a_color;
attribute float a_randomSize;

uniform vec2 u_resolution;
uniform float u_size;
uniform float u_flowMaxLifeTime;
uniform sampler2D u_gpGpuFlowTexture;

varying vec3 v_color;

void main() {
    vec4 l_gpGpuFlowTexture = texture(u_gpGpuFlowTexture, a_particleUv);
    vec3 l_position = l_gpGpuFlowTexture.xyz;
    vec4 modelPosition = modelMatrix * vec4(l_position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    v_color = a_color;

    // Point size
    float sizeOverLifeTime = 1. - (l_gpGpuFlowTexture.a / u_flowMaxLifeTime);
    float sizeIn = smoothstep(0.0, 0.1, sizeOverLifeTime);
    float sizeOut = 1.0 - smoothstep(0.7, 1.0, sizeOverLifeTime);
    float size = min(sizeIn, sizeOut);
    gl_PointSize = u_size * u_resolution.y * a_randomSize * size;
    gl_PointSize *= (1.0 / -viewPosition.z);
}