attribute vec3 a_data;

varying float v_distanceFromPointer;
varying float v_hitInfluenceRadius;
varying float v_shineRnd;

uniform float u_time;
uniform float u_shineTimeRatio;
uniform float u_shinePerc;
uniform float u_posPerc;
uniform vec3 u_hitPos;

void main() {
    //use rnd as a delay
    float adjustedPerc = smoothstep(a_data.y, 1.0, u_posPerc);

    vec3 currPos = mix(vec3(0.0), position, adjustedPerc);
    vec4 modelPosition = modelMatrix * vec4(currPos, 1.0);

    vec3 worldPos = modelPosition.xyz;
    //opposite direction of frag pos from hitPos
    vec3 dir = normalize(worldPos - u_hitPos);
    //distance from point
    float distanceFromPointer = distance(worldPos, u_hitPos);

    v_hitInfluenceRadius = 7.5;

    // intensity of push from 0 to 1
    float force = clamp((v_hitInfluenceRadius - distanceFromPointer) / v_hitInfluenceRadius, 0.0, 1.0);
    // max push
    float pushStrength = 1.5;
    //push away the frag
    modelPosition.xyz += dir * force * pushStrength;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;

    gl_Position = projPosition;

    v_shineRnd = a_data.y;
    float l_shineRnd = a_data.y; 
    //calc the shine and if it's shining
    //normalize sin from 0.2 to 2.2
    float shine = sin(u_time * l_shineRnd * u_shineTimeRatio + l_shineRnd * 100.) + 1.;
    //1 - edge perc of starts will shine
    float isShining = step(1. - u_shinePerc, l_shineRnd);
    //the shining stars will have the color value go from, 0.8 to 1.8 mult
    shine = mix(1., shine, isShining);

    gl_PointSize = a_data.x * shine;
    gl_PointSize *= (1.0 / -viewPosition.z);

    v_distanceFromPointer = distanceFromPointer;
}   