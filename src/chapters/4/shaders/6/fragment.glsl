precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

uniform float u_time;
uniform float u_stripesNumber;
uniform float u_fresnelIntensity;
uniform float u_stripesSpeedRatio;

void main() {
    //create stripes pattern
    float posY = v_position.y - u_time * u_stripesSpeedRatio;
    float transparency = pow(mod(posY * u_stripesNumber * 0.5, 1.), 3.);

    //using double side on trasparent, if we don't
    //reverse the normals. we get values that go over 1 
    //and result in odd artifacts in transparency
    vec3 normal = v_normal;
    if(!gl_FrontFacing)
        normal *= -1.0;

    vec3 watcherToFragmentDirection = normalize(v_position - cameraPosition);
    //fresnel
    //parallel 1, perpendicular 0, opposite -1, add 1 to get from 0 to 2
    float fresnel = dot(watcherToFragmentDirection, normal) + 1.;
    //increase the strenght of fresnel towards the edges
    fresnel = pow(fresnel, 2.);
    float holographic = fresnel * transparency;
    //this sum achieves the results 
    //of always having a "background"
    //by raising overall opacity
    holographic += fresnel * u_fresnelIntensity;
    //blend off the edges
    float falloff = smoothstep(0.8, 0.0, fresnel);
    holographic *= falloff;
    vec4 stripeColor = vec4(vec3(0.0, 1.0, 1.0), holographic);
    gl_FragColor = vec4(stripeColor);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}