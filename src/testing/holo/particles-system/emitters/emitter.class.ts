import type { Particle } from "../particles-system-simulator.class";

export abstract class Emitter {
    /** 
     * calculate new starting position and direction of particles. 
     * Writes data directly in passed parameter
     * */
    public abstract setStartingData(particle: Particle): void;

    constructor() {
    }
}