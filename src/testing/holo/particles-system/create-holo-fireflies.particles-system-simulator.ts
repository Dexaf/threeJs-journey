import { Quaternion, Vector3 } from "three";
import { SemiSphereEmitter } from "./emitters/semi-sphere.emitter";
import { Particle, ParticlesSystemSimulator } from "./particles-system-simulator.class";

export function createHoloFirefliesParticlesSystemSimulator(
    radius: number,
    maxAngle: number,
    particlesOnScreen: number,
    spawnRate: number,
    synchFromSimulation: (particle: HoloFireParticle) => void,
) {
    return new HoloFirefliesParticlesSystemSimulator(
        particlesOnScreen,
        spawnRate,
        new SemiSphereEmitter(radius, maxAngle),
        synchFromSimulation
    );
}

/** holo fireflies particles system simulator */
export class HoloFirefliesParticlesSystemSimulator extends ParticlesSystemSimulator<HoloFireParticle, SemiSphereEmitter> {
    /** updates direction of particles system to point UP of systemOrientation's holder space*/
    public set systemOrientation(q: Quaternion) {
        this.overwrittenParticlesDirection = new Vector3(0, 1, 0).applyQuaternion(q.clone().conjugate());
    }
    private overwrittenParticlesDirection: Vector3 = new Vector3();

    constructor(
        particlesOnScreenNum: number,
        spawnRate: number,
        semiSphereEmitter: SemiSphereEmitter,
        synchFromSimulation: (particle: HoloFireParticle) => void,
    ) {
        super(particlesOnScreenNum, spawnRate, semiSphereEmitter);
        this.synchFromSimulation = synchFromSimulation;
    }

    //assigned from ctor
    synchFromSimulation: (particle: HoloFireParticle) => void;

    protected override createParticle(index: number): HoloFireParticle {
        return HoloFireParticle.createParticle(index);
    }

    protected override updateSpawnedParticle(particle: HoloFireParticle) {
        particle.direction = this.overwrittenParticlesDirection;
    }

    override halt() {
        this.particles.forEach(particle => {
            particle.lifespan = 0
            this.synchFromSimulation(particle);
        });
        this.particlesOnScreen = [];
        this.shouldUpdate = false;
    }

    override stop() {
        this.shouldUpdate = false;
    }

    override resume() {
        this.shouldUpdate = true;
    }
}

export class HoloFireParticle extends Particle {
    public override get isDead(): boolean {
        return this.lifespan <= 0;
    }

    constructor(
        index: number,
        position: Vector3, direction: Vector3, velocity: number, acceleration: number,
        lifespan: number
    ) {
        super(
            index,
            position, direction, velocity, acceleration,
            lifespan
        );
    }

    public static createParticle(index: number): HoloFireParticle {
        //particle constructor
        return new HoloFireParticle(
            //index
            index,
            //position
            new Vector3(),
            //direction
            new Vector3(),
            //velocity
            0.5,
            //acceleration
            2,
            //lifespan
            1000
        )
    }

    override start() {
        this.isShown = true;
        this.lifespan = this.startingLifespan;
        this.currVelocity = this.velocity;
    };

    override update(deltaTime: number) {
        //increase speed by acceleration
        this.currVelocity += this.acceleration * deltaTime;
        //change position
        this.position.add(
            this.direction.clone().multiplyScalar(
                this.currVelocity * deltaTime
            )
        );
        //update lifespan
        this.lifespan -= deltaTime * 1000;
        if (this.isDead) {
            this.isShown = false;
            this.lifespan = 0;
        }
    };
}