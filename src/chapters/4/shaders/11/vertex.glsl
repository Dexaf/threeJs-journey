attribute float a_intensity;

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform sampler2D u_displacementTexture;

varying vec3 v_color;

void main() {
    // Final position
    vec4 l_displacementTexture = texture(u_displacementTexture, uv).rgba;
    vec3 l_position = position;
    float displacement = l_displacementTexture.r;
    displacement = smoothstep(0.1, 0.3, displacement);
    l_position.z += displacement * 3. * a_intensity;

    vec4 modelPosition = modelMatrix * vec4(l_position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vec4 l_texture = texture(u_texture, uv).rgba;
    v_color = l_texture.rgb;
    float textureIntensity = l_texture.a;

    //scale with screen resolution
    //the idea is to use a black and white texture and use the red 
    //channel to make the point smaller where it's black and bigger where it's 
    //white, now, i'm using a colored texture so we need to take the alpha 
    gl_PointSize = 0.3 * textureIntensity * u_resolution.y;
    gl_PointSize = clamp(gl_PointSize, 20.0, 50.0);
    //invert scale with distance
    gl_PointSize *= (1.0 / -viewPosition.z);
}