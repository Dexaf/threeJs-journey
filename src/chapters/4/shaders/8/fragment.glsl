precision mediump float;

uniform vec3 u_modelColor;
uniform vec3 u_lightColor;
uniform float u_reflectionIntensity;
uniform float u_pointLightDistance;

varying vec3 v_normal;
varying vec3 v_position;

//ambient light, added everywhere with no regard of position
vec3 ambientLight(vec3 lightColor, float lightIntensity) {
    return lightColor * lightIntensity;
}

//directional light, a global light that depends only on the direction of the rays 
//and not the position
vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightDirection, vec3 viewDirection) {
    //always a good idea to normalize before doing dot product
    vec3 l_lightDirection = normalize(lightDirection);

    //we need to reflect the light.
    vec3 lightReflection = reflect(l_lightDirection, normal);

    //with the dot we get how parallel is the reflection of the light in regard of 
    //where we are watching
    //we have to reverse the dot product because to us, the max reflection is
    //when light ref and view direction are opposite, but the dot 
    //gives -1 when opposite
    float specular = -dot(lightReflection, viewDirection);
    specular = max(0., specular);
    specular = pow(specular, u_reflectionIntensity);

    float shading = -dot(l_lightDirection, normal); 
    //add a bit of light to make the light hug the edges
    shading = clamp(shading + 0.05, 0., 1.);
    return (lightColor * lightIntensity * shading) + (lightColor * specular * lightIntensity);
}

//point light, a light that has a direction, position and decay
vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 fragPosition, vec3 viewDirection, float lightDecayDistance) {
    vec3 lightDirection = fragPosition - lightPosition;
    //always a good idea to normalize before doing dot product
    vec3 lightDirectionNormalized = normalize(lightDirection);

    //we need to reflect the light.
    vec3 lightReflection = reflect(lightDirectionNormalized, normal);

    //with the dot we get how parallel is the reflection of the light in regard of 
    //where we are watching
    //we have to reverse the dot product because to us, the max reflection is
    //when light ref and view direction are opposite, but the dot 
    //gives -1 when opposite
    float specular = -dot(lightReflection, viewDirection);
    specular = max(0., specular);
    specular = pow(specular, u_reflectionIntensity);

    //1 parallel .. 0 perpendicular .. -1 opposite
    float shading = -dot(lightDirectionNormalized, normal); 
    //add a bit of light to make the light hug the edges
    shading = clamp(shading + 0.05, 0., 1.);

    float lightDistance = length(lightDirection);
    float lightPower = lightDecayDistance - lightDistance;
    lightPower = max(.0, lightPower / lightDecayDistance);

    vec3 light = (lightColor * lightIntensity * shading) + (lightColor * specular * lightIntensity);
    return light * lightPower;
}

void main() {
    //if we want to normalize the normals for light calcs
    //we need to do it here because after the vertex shader
    //the gpu interpolate the vertex breaking the normalization done before 
    vec3 l_normal = normalize(v_normal);

    vec3 l_color = u_modelColor;

    //always a good idea to normalize before doing dot product
    vec3 viewDirection = normalize(v_position - cameraPosition);

    // Lights
    vec3 sumOfLights = vec3(.0);
    sumOfLights += ambientLight(
        vec3(1., 1., 1.), 
        .03
    );
    sumOfLights += directionalLight(
        u_lightColor, 
        1.2, 
        l_normal, 
        vec3(1., 1., 1.), 
        viewDirection
    );
    sumOfLights += pointLight(
        vec3(0.0, 0.97, 1.0), 
        2., 
        l_normal, 
        vec3(.0, 3., .0),
        v_position,
        viewDirection,
        u_pointLightDistance
    );
    sumOfLights += pointLight(
        vec3(1.0, 0.0, 0.0), 
        3., 
        l_normal, 
        vec3(.0, 0., 6.),
        v_position,
        viewDirection,
        u_pointLightDistance
    );

    //multiply color with light, if light is zero, we see nothing
    //as in real life
    l_color *= sumOfLights;

    gl_FragColor = vec4(l_color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}