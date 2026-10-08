import { type Object3D, AnimationMixer, type AnimationAction, AnimationClip } from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

export type SceneActor = {
    root: Object3D;
    mixer: AnimationMixer;
    placeAction?: AnimationAction;
    bodyAction?: AnimationAction;
};

export type ActorAnimationsNames = {
    placeClip?: string;
    bodyClip?: string;
};

export function createActor(
    configuration: ActorAnimationsNames,
    scene: Object3D,
    clips: AnimationClip[]
): SceneActor {
    //Duplicate hierarchy, bones and skeleton, 
    //needed for skeletal animations
    const root = SkeletonUtils.clone(scene);

    const mixer = new AnimationMixer(root);

    //place clip
    let placeAction;
    if (configuration.placeClip) {
        const clip = clips.find(c => c.name === configuration.placeClip);
        if (clip)
            placeAction = mixer.clipAction(clip).play();
        else
            console.error(`createActor - place clip ${configuration.placeClip} not found for ${scene.name}`)
    }

    //body clip
    let bodyAction;
    if (configuration.bodyClip) {
        const clip = clips.find(c => c.name === configuration.bodyClip);
        if (clip)
            bodyAction = mixer.clipAction(clip).play();
        else
            console.error(`createActor - body clip ${configuration.bodyClip} not found for ${scene.name}`)
    }

    return {
        root,
        mixer,
        placeAction,
        bodyAction
    };
};
