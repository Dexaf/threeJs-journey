precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

uniform float u_time;
uniform float u_glitchStrength;
uniform float u_glitchSpeed;

float randomVec2(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) *
        43758.5453123);
}

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float glitchTime = u_time * u_glitchSpeed - modelPosition.y;
    //more randomness
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) +  sin(glitchTime * 8.76);
    //make randomness go from -1 to 1
    glitchStrength /= 3.0;
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
    glitchStrength *= u_glitchStrength;
    modelPosition.x += (randomVec2(modelPosition.xz + u_time) - 0.5) * glitchStrength;
    modelPosition.z += (randomVec2(modelPosition.zx + u_time) - 0.5) * glitchStrength;
    v_position = modelPosition.xyz;
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
    v_normal = normalize(modelNormal.xyz);
    v_uv = uv;
}