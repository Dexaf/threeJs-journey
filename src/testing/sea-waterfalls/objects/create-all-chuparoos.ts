import type { GLTF } from "three/examples/jsm/Addons.js";
import { type SceneActor, createActor } from "./create-actor";

export function createAllChuparoos(chuparooGltf: GLTF): SceneActor[] {
    return [
        createActor(
            //configuration
            {
                placeClip: "place_chuparoo_idle",
                bodyClip: 'anim_chuparoo_idle'
            },
            //scene
            chuparooGltf.scene,
            //animations
            chuparooGltf.animations
        ),
        createActor(
            //configuration
            {
                placeClip: "place_chuparoo_hop_01",
                bodyClip: 'anim_chuparoo_hop'
            },
            //scene
            chuparooGltf.scene,
            //animations
            chuparooGltf.animations
        ),
        createActor(
            //configuration
            {
                placeClip: "place_chuparoo_hop_02",
                bodyClip: 'anim_chuparoo_hop'
            },
            //scene
            chuparooGltf.scene,
            //animations
            chuparooGltf.animations
        ),
    ];
}