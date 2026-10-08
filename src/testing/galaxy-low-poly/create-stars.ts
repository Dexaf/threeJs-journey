import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LinearFilter, Points, ShaderMaterial, Texture, TextureLoader, Uniform, Vector2, Vector3 } from "three";
import vertexShader from './star-shader/vertex.glsl?raw';
import fragmentShader from './star-shader/fragment.glsl?raw';
import { centeredRandom } from "../../utils/centered-random";
import { degToRad } from "three/src/math/MathUtils.js";

export const STARS_PARTICLES_KEY = "star_particles";

export interface IStarsParticlesUniform {
    u_time: Uniform<number>,
    u_color: Uniform<Color>,
    u_shineTimeRatio: Uniform<number>,
    u_shinePerc: Uniform<number>,
    u_posPerc: Uniform<number>,
    u_mask: Uniform<Texture<HTMLImageElement> | null>,
    u_hitPos: Uniform<Vector3>,
}

export const starsUniforms: IStarsParticlesUniform = {
    u_time: new Uniform(0),
    u_shineTimeRatio: new Uniform(1.),
    u_shinePerc: new Uniform(.1),
    u_posPerc: new Uniform(1.),
    u_mask: new Uniform(null),
    u_hitPos: new Uniform(new Vector3(9999, 9999, 9999)),
    u_color: new Uniform(new Color('#ffffff'))
}

/** star point size */
const STAR_SIZE = 200;
const STAR_SIZE_RANGE = 20;
const BIG_STAR_SIZE_RANGE = 50;
const BIG_STAR_PERC = 0.1;
/** number of points */;
const STARS_NUMBER = 500;
/** max distance of stars in galaxy */
const MAX_STAR_DISTANCE_HOR = 8;
const MAX_STAR_DISTANCE_Y = 3;
const MIN_DIST_FROM_CENTER = 0.3;

/**
 * @param pixelRatio 
 * @returns the sfyri3DEntity for the stars particles
 * create a random points based particles system that simulate a galaxy 
 */
export function createStarsParticles() {
    const textureLoader = new TextureLoader();
    const text = textureLoader.load('/assets/textures/stars/star-mask.png', () => {
        text.generateMipmaps = false;
        text.minFilter = LinearFilter;
        text.magFilter = LinearFilter;
    });
    starsUniforms.u_mask.value = text;

    //particles geometry
    const starsParticlesGeometry = new BufferGeometry();

    //num of params for position (x,y,z)
    const totalPos = STARS_NUMBER * 3;
    const particlesPositionArray = new Float32Array(totalPos);
    //array data for particles where
    // first value is X is used for sizes 
    // second value is Y is used for rnd value
    const particlesDataArray = new Float32Array(STARS_NUMBER * 2);

    for (let i = 0, y = 0; i < totalPos; i += 3, y++) {
        const cntRnd = Math.random();
        const rndAng = degToRad(Math.random() * 360);
        let rndDist = Math.random();
        while (rndDist < MIN_DIST_FROM_CENTER) {
            rndDist = Math.random();
        }
        rndDist = rndDist * MAX_STAR_DISTANCE_HOR;

        //X POS
        particlesPositionArray[i] = Math.sin(rndAng) * rndDist;
        //Y POS
        particlesPositionArray[i + 1] = cntRnd * MAX_STAR_DISTANCE_Y;
        //Z POS
        particlesPositionArray[i + 2] = Math.cos(rndAng) * rndDist;

        //SIZE 
        particlesDataArray[y * 2] = STAR_SIZE
        //big star
        if (Math.random() <= BIG_STAR_PERC) {
            //size goes from 1 time the size + 1 time big star size to 1 + 3 times the big star size
            particlesDataArray[y * 2] += (centeredRandom() + 2) * BIG_STAR_SIZE_RANGE;
        } else
            //size goes from 1 time the size to 1 + 2 times the range max
            particlesDataArray[y * 2] += (cntRnd + 1) * STAR_SIZE_RANGE;
        particlesDataArray[y * 2 + 1] = Math.random() * 0.5 + 0.5;
    }
    starsParticlesGeometry.setAttribute('position', new BufferAttribute(particlesPositionArray, 3));
    starsParticlesGeometry.setAttribute('a_data', new BufferAttribute(particlesDataArray, 2));


    //particles object
    const starsParticles = new Points(
        starsParticlesGeometry,
        new ShaderMaterial({
            blending: AdditiveBlending,
            fragmentShader: fragmentShader,
            vertexShader: vertexShader,
            vertexColors: true,
            uniforms: starsUniforms as any,
            depthTest: false,
            depthWrite: false,
            transparent: true,
        })
    );

    return starsParticles;
}