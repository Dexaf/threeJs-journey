precision mediump float;

// in questo caso non dobbiamo dichiararlo, 
// gpGpu init lo inserisce per noi
// uniform sampler2D u_particles;

uniform float u_time;
uniform float u_deltaTime;
uniform float u_flowIntensity;
uniform float u_flowMaxLifeTime;
uniform float u_flowSpeedRatio;
uniform float u_flowFieldInfluence;
uniform sampler2D u_startingPositionTexture;

//SECTION - FUNCTIONS
//	Simplex 4D Noise 
//	by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
float permute(float x) {
    return floor(mod(((x * 34.0) + 1.0) * x, 289.0));
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
float taylorInvSqrt(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p, s;

    p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;

    return p;
}

float simplexNoise4d(vec4 v) {
    const vec2 C = vec2(0.138196601125010504,  // (5 - sqrt(5))/20  G4
    0.309016994374947451); // (sqrt(5) - 1)/4   F4
// First corner
    vec4 i = floor(v + dot(v, C.yyyy));
    vec4 x0 = v - i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    vec4 i0;

    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
//  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;

//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
    vec4 i3 = clamp(i0, 0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

  //  x0 = x0 - 0.0 + 0.0 * C 
    vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
    vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
    vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
    vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

// Permutations
    i = mod(i, 289.0);
    float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute(permute(permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0)) + i.y + vec4(i1.y, i2.y, i3.y, 1.0)) + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
// Gradients
// ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

    vec4 p0 = grad4(j0, ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4, p4));

// Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}
//!SECTION - FUNCTIONS

void main() {
    //dato che non abbiamo accesso ad un vertex shader
    //dobbiamo calcolare le uv con le coordinate del 
    //frammento e la risoluzione della texture
    vec2 l_uv = gl_FragCoord.xy / resolution.xy;
    vec4 l_particles = texture(u_particles, l_uv);

    vec4 l_startingPositionTexture = texture(u_startingPositionTexture, l_uv);

    //particella a fine durata di movimento
    if(l_particles.a >= u_flowMaxLifeTime) {
        l_particles.xyz = l_startingPositionTexture.xyz;
        //al posto di assegnare direttamente 0 usiamo un modulo
        //questo perche' per dare un effetto naturale, diamo un 
        //tempo di partenza randomico alle particelle
        //ma se l'utente esce dalla pagina e rientra dopo 5 secondi
        //il delta time diventa cosi grosso che le particelle
        //arrivano oltre il limite di vita in simultanea
        //e inizia il bug di snapback
        //con il modulo messo cosi, nel peggiore dei casi, 
        //vanno ad un valore diverso da quello che doveva essere calcolato
        //ma che comunque e' distanziato dello stesso random iniziale
        l_particles.a = mod(l_particles.a, u_flowMaxLifeTime);
    } 
    //particella in movimento
    else {
        // SECTION - FLOW FIELD
        // we add a number to alter the noise result, else it would just go
        // diagonally
        // and we add time to avoid for the noise to make loops
        float time = u_time * u_flowSpeedRatio * u_deltaTime;

        vec3 flowField = vec3(simplexNoise4d(vec4(l_particles.xyz, time)), simplexNoise4d(vec4(l_particles.xyz + 1., time)), simplexNoise4d(vec4(l_particles.xyz + 2., time)));
        // the flow field is made of directions, as such we should apply a normalization
        flowField = normalize(flowField);

        //usiamo la texture di base per creare un noise organico che 
        //ci consente di spostare in modo "randomico" le varie particelle
        float strength = simplexNoise4d(vec4(l_startingPositionTexture.xyz * 0.2, time + 1.0));
        //il noise va da -1 a 1, per creare una mappa ci servono valori da 0 a 1
        float influence = (u_flowFieldInfluence - 0.5) * (- 2.0);
        strength = smoothstep(influence, 1., strength);

        //apply direction change
        l_particles.xyz += flowField * u_flowIntensity * strength;
        // !SECTION - FLOW FIELD
    }

    //SECTION - DECAY
    //fino ad ora abbiamo ignorato il quarto valore, ma possiamo 
    //usarlo come 'slot' per salvare la durata di una particella
    //aka da quanto gira
    l_particles.a += u_deltaTime;
    //!SECTION - DECAY

    gl_FragColor = vec4(l_particles);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}