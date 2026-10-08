import type { GLTF } from "three/examples/jsm/Addons.js";
import { type ActorAnimationsNames, type SceneActor, createActor } from "./create-actor";

const brachioslugAnimations: ActorAnimationsNames[] = [
    {
        placeClip: "place_brachioslug_eat_01",
        bodyClip: "anim_brachioslug_eat"
    },
    {
        placeClip: "place_brachioslug_eat_02",
        bodyClip: "anim_brachioslug_eat"
    },
    {
        placeClip: "place_brachioslug_eat_03",
        bodyClip: "anim_brachioslug_eat"
    },
    {
        placeClip: "place_brachioslug_baby",
        bodyClip: "anim_brachioslug_idle"
    },
    {
        placeClip: "place_brachioslug_walk_02",
        bodyClip: "anim_brachioslug_walk"
    }
];

export function createAllBrachioslugs(brachioslugGltf: GLTF): SceneActor[] {
    return brachioslugAnimations.map(configuration =>
        createActor(configuration, brachioslugGltf.scene, brachioslugGltf.animations)
    );
}
