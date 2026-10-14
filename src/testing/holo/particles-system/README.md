# Particles system simulator
This document talks about the logic behind the ParticlesSystemSimulator system: 
a __light-weight__ and __flexible__ simulator system for particles.
It's made by 3 main entities:
- __The Particle__: the generic object that handles the physics of the single particle with it's lifetime.
- __The Emitter__: the emitter it's a object that should simulates geometric data of a shape and use it to impose initial positions and direction of particles when they "start living".
- __The ParticlesSystemSimulator__: this bigger object orchestrate the simulation by handling spawn rate, recycle of died particles, update of particles and exposes methods to override that allows to personalize how to create the particle object and it's properites before starting the "new" particle.