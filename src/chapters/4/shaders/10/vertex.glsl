varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;

void main()
{
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Model normal
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    // Varyings
    v_uv = uv;
    v_normal = modelNormal;
    v_position = modelPosition.xyz;
}