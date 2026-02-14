uniform sampler2D u_texture_day;
uniform sampler2D u_texture_night;
uniform sampler2D u_texture_specularClouds;
uniform vec3 u_atmosphere_day_color;
uniform vec3 u_atmosphere_night_color;

uniform vec3 u_sunPosition;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
    vec3 viewDirection = normalize(v_position - cameraPosition);
    vec3 normal = normalize(v_normal);

    vec3 texture_day = texture(u_texture_day, v_uv).rgb;
    vec3 texture_night = texture(u_texture_night, v_uv).rgb;
    vec2 texture_specularClouds = texture(u_texture_specularClouds, v_uv).rg;

    //SUNLIGHT DIRECTION AND LIGHT ON EARTH
    vec3 sunlight_direction = -normalize(u_sunPosition);
    float lightningOnEarth = -dot(sunlight_direction, normal);
    //this allows us to have a smoother transition from day to night and avoid
    //the night lights on in the mix between 0 to 0.5
    //NOTE: this method isn't really transparent as to make more sense
    //we should divide the earth lightning from 0 to 1 with 0.5 as threshold 
    //for night and day and then use the smooth step from 0.4 to 0.6
    lightningOnEarth = smoothstep(-0.3, .4, lightningOnEarth);

    vec3 earthFinalColor = mix(texture_night, texture_day, lightningOnEarth);

    //CLOUDS
    float clouds = texture_specularClouds.g;
    vec3 cloudColor = vec3(1.);
    vec3 nightCloudColor = vec3(0.0, 0.0, 0.07);
    vec3 finalCloudColor = mix(nightCloudColor, cloudColor, lightningOnEarth);
    //decrease cloud intensity to bigger cloud only
    clouds = smoothstep(0.1, 1., clouds);
    earthFinalColor = mix(earthFinalColor, finalCloudColor, clouds);

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
    //make specular appear only in the "mask" and majorly in the sea.
    //on sea we have 1, in ground 0, so we give a minimum of 0.2
    float soilReflectivity = texture_specularClouds.r + 0.2;
    vec3 finalSpecularColor = vec3(1.) * specular * soilReflectivity;
    //mix the specular color with the atmosphere color when the specular is on the same zone of the fresnel "mask" 
    finalSpecularColor = mix(finalSpecularColor, finalAtmosphereColor, specular * atmosphereFresnel);
    earthFinalColor += finalSpecularColor; 

    // Final color
    gl_FragColor = vec4(vec3(earthFinalColor), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}