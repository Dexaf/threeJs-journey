uniform vec3 u_atmosphere_day_color;
uniform vec3 u_atmosphere_night_color;

uniform vec3 u_sunPosition;

varying vec3 v_normal;
varying vec3 v_position;

void main() {
    vec3 viewDirection = normalize(v_position - cameraPosition);
    vec3 normal = normalize(v_normal);

    //SUNLIGHT DIRECTION AND LIGHT ON EARTH
    vec3 sunlight_direction = -normalize(u_sunPosition);
    float lightningOnEarth = -dot(sunlight_direction, normal);
    //this allows us to have a smoother transition from day to night and avoid
    //the night lights on in the mix between 0 to 0.5
    //NOTE: this method isn't really transparent as to make more sense
    //we should divide the earth lightning from 0 to 1 with 0.5 as threshold 
    //for night and day and then use the smooth step from 0.4 to 0.6
    lightningOnEarth = smoothstep(-0.3, .4, lightningOnEarth);

    //ATMOSPHERE
    vec3 finalAtmosphereColor = mix(u_atmosphere_night_color, u_atmosphere_day_color, lightningOnEarth);
    float atmosphereFresnel = 1. - (-dot(normal, viewDirection));
    atmosphereFresnel = smoothstep(0.5, 0.9, atmosphereFresnel);
    //we don't want to see atmosphere in night side
    atmosphereFresnel *= lightningOnEarth;

    //SUN LIGHT SPECULAR
    vec3 sunlight_direction_on_frag = normalize(v_position - u_sunPosition);
    vec3 sunlight_reflection = reflect(sunlight_direction_on_frag, normal);
    float specular = -dot(sunlight_reflection, viewDirection);
    specular = max(0., specular);
    specular = pow(specular, 20.);
    specular = min(specular, 0.75);
    vec3 finalSpecularColor = vec3(1.) * specular;
    //mix the specular color with the atmosphere color when the specular is on the same zone of the fresnel "mask" 
    finalSpecularColor = mix(finalSpecularColor, finalAtmosphereColor, specular * atmosphereFresnel);
    finalAtmosphereColor += finalSpecularColor;

    float alpha = specular * atmosphereFresnel + atmosphereFresnel;

    // Final color
    gl_FragColor = vec4(vec3(finalAtmosphereColor), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}