import {
    BufferAttribute,
    BufferGeometry,
    Points,
    ShaderMaterial,
    Uniform,
    Vector2,
} from "three";

import fragmentShader from "./fragment.glsl?raw";
import vertexShader from "./vertex.glsl?raw";
import { centeredRandom } from "../../utils/centered-random";

export interface ParticlesParameters {
    particlesNumber: number;
    distanceX: number;
    distanceY: number;
    distanceZ: number;
    minCenterDistance: number;
}

export const defaultParticlesParameters: ParticlesParameters = {
    particlesNumber: 200,
    distanceX: 3,
    distanceY: 2,
    distanceZ: 5,
    minCenterDistance: 1.5,
};

export const uniforms = {
    // Runtime
    u_time: new Uniform(0),
    u_size: new Uniform(100),
    u_resolution: new Uniform(new Vector2()),

    // Movimento
    u_acceleration: new Uniform(1),
    u_maxVelocity: new Uniform(5),
    u_loopDistance: new Uniform(10),
    u_motionSample: new Uniform(1 / 60),

    // Testa
    u_headSize: new Uniform(1),
    u_headFalloff: new Uniform(10),
    u_headIntensity: new Uniform(1),

    // Coda
    u_tailLength: new Uniform(1),
    u_tailThickness: new Uniform(1),
    u_tailHeadThickness: new Uniform(1),
    u_tailTaperFalloff: new Uniform(1),
    u_tailEdgeFalloff: new Uniform(80),
    u_tailLengthFalloff: new Uniform(1),
    u_tailIntensity: new Uniform(1),

    // Output
    u_opacity: new Uniform(1),
};

/**
 * Crea un nuovo sistema di particelle.
 *
 * La funzione riceve i parametri fisici perché questi determinano
 * direttamente la geometria e richiedono quindi una nuova istanza.
 */
export const createParticles = (
    parameters: ParticlesParameters = defaultParticlesParameters,
): Points<BufferGeometry, ShaderMaterial> => {
    const {
        particlesNumber,
        distanceX,
        distanceY,
        distanceZ,
        minCenterDistance,
    } = parameters;

    const geometry = new BufferGeometry();

    const positions = new Float32Array(particlesNumber * 3);
    const random = new Float32Array(particlesNumber);

    const position2D = new Vector2();

    for (let i = 0; i < particlesNumber; i++) {
        const index3 = i * 3;

        random[i] = Math.random();
        position2D.set(
            centeredRandom() * distanceX,
            centeredRandom() * distanceY,
        );

        const distanceToCenter = position2D.length();

        if (distanceToCenter < minCenterDistance) {
            /*
             * Vector2(0, 0).normalize() resta (0, 0), quindi gestiamo
             * esplicitamente questa rara eventualità.
             */
            if (distanceToCenter === 0) {
                const angle = Math.random() * Math.PI * 2;

                position2D.set(
                    Math.cos(angle) * minCenterDistance,
                    Math.sin(angle) * minCenterDistance,
                );
            } else {
                position2D.setLength(minCenterDistance);
            }
        }

        positions[index3] = position2D.x;
        positions[index3 + 1] = position2D.y;
        positions[index3 + 2] = centeredRandom() * distanceZ;
    }

    geometry.setAttribute(
        "position",
        new BufferAttribute(positions, 3),
    );

    geometry.setAttribute(
        "a_random",
        new BufferAttribute(random, 1),
    );

    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
    });

    return new Points(geometry, material);
};