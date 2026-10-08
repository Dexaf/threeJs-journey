precision mediump float;

uniform sampler2D u_mask;
uniform vec3 u_color;

varying float v_distanceFromPointer;
varying float v_hitInfluenceRadius;
varying float v_shineRnd;

// Rotates a UV coordinate around the center (0.5, 0.5)
vec2 rotateUV(vec2 uv, float angle)
{
    // Move UV origin to center
    vec2 centered = uv - 0.5;

    // Build 2D rotation matrix
    float c = cos(angle);
    float s = sin(angle);
    mat2 rot = mat2(
        c, -s,
        s,  c
    );

    // Apply rotation
    vec2 rotated = rot * centered;

    // Move UV back to [0, 1] space
    return rotated + 0.5;
}

void main() {
    vec2 rotPointUv = rotateUV(gl_PointCoord, v_shineRnd * 6.28);
    float mask = texture(u_mask, rotPointUv).b;

    vec3 color = u_color;

    //increase color saturation when pointer near fragment
    color = mix(
        vec3(0.46, 0.21, 1.0), 
        color, 
        pow(smoothstep(0., v_hitInfluenceRadius, v_distanceFromPointer),2.)
    );

    gl_FragColor = vec4(color, mask);
}