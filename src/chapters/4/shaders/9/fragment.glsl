precision mediump float;

uniform vec3 u_lightColor;
uniform vec3 u_objectColor;
uniform vec3 u_pointColor;
uniform vec2 u_resolution;
uniform float u_gridDensity;
uniform float u_gridDotRadiusRatio;

varying vec3 v_normal;
varying vec3 v_position;

vec3 ambientLight(vec3 lightColor, float lightIntensity) {
    return lightColor * lightIntensity;
}

vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightDirection, vec3 viewDirection) {
    vec3 l_lightDirection = normalize(lightDirection);
    vec3 lightReflection = reflect(l_lightDirection, normal);

    float specular = -dot(lightReflection, viewDirection);
    specular = max(0., specular);
    specular = pow(specular, 2.);

    float shading = -dot(l_lightDirection, normal);
    shading = clamp(shading + 0.05, 0., 1.);

    return (lightColor * lightIntensity * shading) + (lightColor * specular * lightIntensity);
}

void main() {
    vec3 normalizedNormal = normalize(v_normal);
    vec3 viewDirection = v_position - cameraPosition;
    viewDirection = normalize(viewDirection);

    vec3 sumOfLight = vec3(0.);
    sumOfLight += ambientLight(u_lightColor, 0.7);

    vec3 dirLightDirection = vec3(3., -3., 3.);
    sumOfLight += directionalLight(u_lightColor, 1., normalizedNormal, dirLightDirection, viewDirection);

    //the coords go from 0 to the resolution of the renderer
    //to normalize the values we need to divide by the resolution
    vec2 screenUv = vec2(0.);
    screenUv = gl_FragCoord.xy / u_resolution.y;

    screenUv = mod(screenUv * u_gridDensity, 1.);

    float pointAlpha = distance(vec2(0.5, 0.5), screenUv);
    float l_gridDotRadiusRatio = u_gridDotRadiusRatio;
    vec3 halfToneLightDirection = vec3(1, -0.5, 0);
    float lightHittingAngle = -dot(normalize(halfToneLightDirection), normalizedNormal);
    lightHittingAngle = max(0., lightHittingAngle);

    //decrease point radius as they go farther from the intended direction
    pointAlpha = step(0.5 * l_gridDotRadiusRatio * lightHittingAngle, pointAlpha);
    pointAlpha = 1. - pointAlpha;
    pointAlpha *= lightHittingAngle;
    pointAlpha = pow(pointAlpha, 3.);

    vec3 color = u_objectColor * sumOfLight;
    color = mix(color, u_pointColor, pointAlpha);
    
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}