uniform float u_size;
uniform float u_time;
uniform float u_radius;

attribute float a_randomSizeMultiplier;

varying float v_distanceFromCenter;

void main() {
    float distanceFromCenter = length(position.xz);
    v_distanceFromCenter = distanceFromCenter;
    v_distanceFromCenter = v_distanceFromCenter / u_radius; //0..1

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float anglePosition = atan(modelPosition.x, modelPosition.z);
    anglePosition += (1. - v_distanceFromCenter) * u_time * 0.2;
    modelPosition.x = cos(anglePosition) * distanceFromCenter;
    modelPosition.z = sin(anglePosition) * distanceFromCenter;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projPosition = projectionMatrix * viewPosition;
    gl_Position = projPosition;

    /**
    * Size
    */
    gl_PointSize = u_size * a_randomSizeMultiplier;

    //size attenuation
    gl_PointSize *= (1.0 / -viewPosition.z);
}