import CANNON from 'cannon';

export const NEUTRAL_DIRECTION = new CANNON.Vec3(0, 0, 0);

export const X_DIRECTION = new CANNON.Vec3(1, 0, 0);
export const Y_DIRECTION = new CANNON.Vec3(0, 1, 0);
export const Z_DIRECTION = new CANNON.Vec3(0, 0, 1);

export const X_INV_DIRECTION = new CANNON.Vec3(-1, 0, 0);
export const Y_INV_DIRECTION = new CANNON.Vec3(0, -1, 0);
export const Z_INV_DIRECTION = new CANNON.Vec3(0, 0, -1);