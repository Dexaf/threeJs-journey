precision mediump float;

varying vec2 v_uv;

uniform float u_time;
uniform float u_windOffsetSmoke;
uniform float u_verticalSmokeSpeedRatio;
uniform sampler2D u_perlinNoiseTexture;

void main() {
    vec2 local_uv = uv;
    local_uv.y -= u_time * u_verticalSmokeSpeedRatio;
    float perlinNoiseChannel = texture(u_perlinNoiseTexture, local_uv).r;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    //aggiungiamo "spessore" al piano
    modelPosition.z += (perlinNoiseChannel - 0.5);
    //spostiamo il fumo in base all'altezza per dare l'idea di vento
    modelPosition.x += uv.y * (sin(u_time) / 3. + u_windOffsetSmoke);
    modelPosition.z -= uv.y * (sin(u_time) / 4. + u_windOffsetSmoke);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    v_uv = uv;
}