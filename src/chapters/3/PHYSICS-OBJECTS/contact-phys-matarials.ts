import CANNON from "cannon";
import { CONCRETE_PhysMaterial, PLASTIC_PhysMaterial } from "./phys-materials";

export const CONCRETE_PLASTIC_contactPhysMaterial = new CANNON.ContactMaterial(
    CONCRETE_PhysMaterial,
    PLASTIC_PhysMaterial,
    {
        friction: 0.1,
        restitution: 0.7,
    }
)