import type { Quaternion, Vector3 } from "three";
import type { Emitter } from "./emitters/emitter.class";

/** system used to handle the simulation of given particles emitted from generic emitter */
export abstract class ParticlesSystemSimulator<T extends Particle, Y extends Emitter> {
    /** object used to set positional and direction data of a particle */
    protected emitter: Y;
    /** buffered particles */
    protected particles: T[] = [];
    /** used particles  */
    protected particlesOnScreen: T[] = [];
    /** passed time for spawn in ms */
    protected spawnTimer: number = 0;
    /** max number of particles on screen */
    particlesOnScreenNum: number;
    /** how long between a particle spawn in ms */
    spawnRate: number;
    /** param used in update to check if system should stop updating*/
    protected shouldUpdate: boolean = true;
    /** param used to bring to an halt the system by 
     * letting the active particles end their life cycle */
    shouldClose: boolean = false;

    /** orientation used by the parent of the node */
    protected abstract systemOrientation: Quaternion;

    constructor(
        particlesOnScreenNum: number,
        spawnTime: number,
        emitter: Y
    ) {
        this.particlesOnScreenNum = particlesOnScreenNum;
        this.spawnRate = spawnTime;
        this.emitter = emitter;
    }

    /** kill simulation and removes particles from the screen */
    public abstract halt(): void;
    /** stop simulation new particles, let the current one die */
    public abstract stop(): void;
    /** resume simulation */
    public abstract resume(): void;
    /** callback used to update data dependant on simulation */
    protected abstract synchFromSimulation(particle: T): void;

    protected abstract createParticle(index: number): T;
    protected abstract updateSpawnedParticle(particle: T): void;

    /** updates simulation */
    public update(deltaTime: number): void {
        if (this.shouldUpdate === false) return;

        //update spawn timer
        this.spawnTimer += deltaTime * 1000;

        if (
            this.particlesOnScreen.length < this.particlesOnScreenNum
            && this.spawnTimer >= this.spawnRate
        ) {
            let numOfNeededParticles = this.spawnTimer / this.spawnRate;
            //save fract
            this.spawnTimer = this.spawnTimer % this.spawnRate;
            //get correct amount of particles to spawn
            numOfNeededParticles =
                Math.min(
                    //the calculated one and
                    Math.floor(numOfNeededParticles),
                    //less then the remaining max amount
                    this.particlesOnScreenNum - this.particlesOnScreen.length
                );
            //spawn needed particles
            for (let i = 0; i < numOfNeededParticles; i++) {
                //try to find existing died particle or create new one
                let particle = this.particles.find(p => p.isDead);
                if (!particle) {
                    particle = this.createParticle(this.particles.length);
                    this.particles.push(particle);
                }
                this.emitter.setStartingData(particle)

                this.updateSpawnedParticle(particle);
                particle.start();

                this.particlesOnScreen.push(particle);
            }
        }

        //update particles
        for (let i = 0; i < this.particlesOnScreen.length; i++) {
            const particle = this.particlesOnScreen[i];
            particle.update(deltaTime);
            this.synchFromSimulation(particle);

            if (particle.isDead) {
                this.particlesOnScreen.splice(i, 1);
                i--;
            }
        }
    };
}

/** object used to simulate upon inside a particle system simulator */
export abstract class Particle {
    //id
    index: number;

    //movement
    position: Vector3;
    direction: Vector3;
    velocity: number;
    currVelocity: number;
    acceleration: number;

    //life related
    /** duration of life span in ms */
    startingLifespan: number;
    /** current life span in ms */
    lifespan: number;
    /** should the particle be in screen */
    isShown: boolean = false;
    /** is life span over */
    abstract get isDead(): boolean;

    constructor(
        index: number,
        position: Vector3, direction: Vector3, velocity: number, acceleration: number,
        lifespan: number
    ) {
        this.index = index;

        this.position = position;
        this.direction = direction;
        this.velocity = velocity;
        this.currVelocity = velocity;
        this.acceleration = acceleration;

        this.startingLifespan = lifespan;
        this.lifespan = lifespan;
    }

    /** called when starting or restarting 
    * animation of particle (after isDead) */
    abstract start(): void;
    /** updates animation of particle */
    abstract update(deltaTime: number): void;

}