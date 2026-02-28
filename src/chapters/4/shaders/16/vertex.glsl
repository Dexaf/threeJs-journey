uniform float u_noiseFrequency;
uniform float u_plateauFrequency;
uniform float u_noiseStrength;

varying float v_elevation;
varying vec2 v_2DPos;

float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}

float getElevation(vec2 position) {
    float elevation = 0.;
    //rendiamo il noise piu "variegato"
    //NOTE - sto modo di fare mi fa un po cagare
    //se volessimo usare il noise come percentile ci serve
    //sapere il limite massimo della somma cosi da poterlo 
    //moltiplicare per un altezza e avere un elevazione controllabile
    elevation += noise2D(position * u_noiseFrequency) / 2.;
    elevation += noise2D(position * u_noiseFrequency * 2.0) / 4.;
    elevation += noise2D(position * u_noiseFrequency * 4.0) / 8.;

    float elevationSign = sign(elevation);

    //visto che stiamo creando un terreno vero, schiacciamo quando e' vicino a zero
    //per produrre le pianure
    elevation = pow(elevation, u_plateauFrequency);

    //questo processo ci permette di evitare che valori sotto zero 
    //diventino positivi per colpa della potenza
    elevation = elevationSign * abs(elevation) * u_noiseStrength;

    return elevation;
}

void main() {
    float elevation = getElevation(csm_Position.xz);
    v_2DPos = csm_Position.xz;
    v_elevation = elevation;

    float delta = 0.1;
    //come al solito, alterando la geoemtria, rompiamo le ombre
    //dobbiamo dunque sistemare le normali usate per calcolarle
    //per farlo usiamo il sistema dei vicini:
    //calcoliamo le pendenze vicine (~0.01) e da li facciamo
    //il prodotto vettoriale per ottenere la perpendicolare (la nostra nuova normale)
    vec3 neighbourXPos = vec3(csm_Position.x + delta, csm_Position.yz);
    float neighbourXElevation = getElevation(neighbourXPos.xz);
    neighbourXPos.y += neighbourXElevation;

    //sulla Z andiamo in negativo perche' senno il cross product viene invertito
    vec3 neighbourZPos = vec3(csm_Position.xy, csm_Position.z - delta);
    float neighbourZElevation = getElevation(neighbourZPos.xz);
    neighbourZPos.y += neighbourZElevation;

    //NOTE -    SOLO ORA CALCOLIAMO L'ELEVAZIONE, PERCHE' SE LO FACCIAMO
    //          PRIMA LE ELEVAZIONI DEI VICINI SONO SCAZZATE
    //          MA SE LO CALCOLIAMO DOPO LE DIREZIONI AD ESSERE SBAGLIATE
    //          SONO LE PENDZE DELLE DIREZIONI
    csm_Position.y += elevation;
    vec3 directionToX = normalize(neighbourXPos - csm_Position);
    vec3 directionToZ = normalize(neighbourZPos - csm_Position);

    vec3 newNormal = normalize(cross(directionToX, directionToZ));
    csm_Normal = newNormal;
}