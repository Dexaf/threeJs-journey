import type { GLTF } from "three/examples/jsm/Addons.js";
import { type ActorAnimationsNames, type SceneActor, createActor } from "./create-actor";

const tardonAnimations: ActorAnimationsNames[] = [
    {
        placeClip: "place_tardon_drink",
        bodyClip: "anim_tardon_drink"
    },
    {
        placeClip: "place_tardon_idle",
        bodyClip: "anim_tardon_idle"
    },
    {
        placeClip: "place_tardon_walk",
        bodyClip: "anim_tardon_walk"
    }
];

export function createAllTardons(tardonGltf: GLTF): SceneActor[] {
    return tardonAnimations.map(configuration =>
        createActor(configuration, tardonGltf.scene, tardonGltf.animations)
    );
}
