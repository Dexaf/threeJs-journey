import { Vector3 } from "three";
import type { Particle } from "../particles-system-simulator.class";
import { degToRad } from "three/src/math/MathUtils.js";
import { Emitter } from "./emitter.class";

export const RIGHT = new Vector3(1, 0, 0);
export const UP = new Vector3(0, 1, 0);

/** this emitter takes in account that locally it's always working "forwards", as such, 
 * to modify the direction you neww
 * to change the direction of the father or a wrapper
 */
export class SemiSphereEmitter extends Emitter {
    /** forward versors of emitter */
    direction = new Vector3(0, 0, -1);
    /** starting position of semisphere */
    radius: number;
    /** max angle in degree used for random position 
     * (X degree will be with range of -+X) */
    maxAngle: number;

    constructor(
        radius: number,
        maxAngle: number,
    ) {
        super();

        this.radius = radius;
        this.maxAngle = degToRad(maxAngle);
    }

    /** 
     * calculate new starting position and direction of particles. 
     * Writes data directly in passed parameter
     * */
    override setStartingData(particle: Particle) {
        const copyDirection = this.direction.clone();
        const tiltingAngleX = (Math.random() * 2 - 1) * this.maxAngle;
        const tiltingAngleY = (Math.random() * 2 - 1) * this.maxAngle;
        copyDirection.applyAxisAngle(
            RIGHT,
            tiltingAngleX
        )
        copyDirection.applyAxisAngle(
            UP,
            tiltingAngleY
        )
        particle.direction = copyDirection;
        particle.position = particle.direction.clone().multiplyScalar(this.radius)
    }
}