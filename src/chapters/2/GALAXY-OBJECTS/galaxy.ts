import * as THREE from 'three'
import { lerp } from 'three/src/math/MathUtils.js';

export const generateGalaxy = (
    p:
        {
            count: number;
            size: number;
            radius: number;
            branches: number;
            spinForce: number;
            scatterRatio: number;
            insideColor: number;
            outsideColor: number
        }
) => {
    const particlesMaterial = new THREE.PointsMaterial({
        size: p.size,
        sizeAttenuation: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
    });
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositionArray = new Float32Array(p.count * 3);
    const repartitionAngle = (Math.PI * 2) / p.branches;

    const particlesColorArray = new Float32Array(p.count * 3);

    const insideColor = new THREE.Color(p.insideColor);
    const outsideColor = new THREE.Color(p.outsideColor);

    for (let i = 0, y = 0;
        i < p.count * 3;
        i += 3, y++) {
        const currAngle = repartitionAngle * (y % p.branches);
        const position = Math.random() * p.radius;

        const spingForceRelToPosition = position * p.spinForce

        const scatterX = Math.pow((Math.random() - 0.5) * p.scatterRatio * (p.radius - (p.radius - position)), 3);
        const scatterY = Math.pow((Math.random() - 0.5) * p.scatterRatio * (p.radius - (p.radius - position)), 3);
        const scatterZ = Math.pow((Math.random() - 0.5) * p.scatterRatio * (p.radius - (p.radius - position)), 3);

        particlesPositionArray[i] = Math.cos(currAngle + spingForceRelToPosition) * position + scatterX;
        particlesPositionArray[i + 1] = scatterY;
        particlesPositionArray[i + 2] = Math.sin(currAngle + spingForceRelToPosition) * position + scatterZ;

        const usedColor = insideColor.clone().lerp(outsideColor, position / p.radius );
        particlesColorArray[i] = usedColor.r
        particlesColorArray[i + 1] = usedColor.g
        particlesColorArray[i + 2] = usedColor.b
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositionArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColorArray, 3));

    return new THREE.Points(
        particlesGeometry,
        particlesMaterial
    )
}