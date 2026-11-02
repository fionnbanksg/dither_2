// Builds the `uniforms` object shared by both shader passes, and the per-frame updaters.
// Every uniform declared in shader/uniforms.js needs an entry here.

import * as THREE from 'three';
import { PALETTE, PALETTE_SIZE } from '../world/palette.js';
import {
  FOV, DITHER_LEVELS, DITHER_STRENGTH, AMBIENT, BLOCK_VOXELS, SOFT_SHADOW_M, MARKER_RADIUS_M,
} from '../config.js';

export function createUniforms({ world, textures, lights, sky }) {
  const vpm = world.voxelsPerMetre;
  const v3 = (a) => new THREE.Vector3(...a);
  const sk = sky.state();
  const palette = Array.from({ length: PALETTE_SIZE }, (_, i) => v3(PALETTE[i] ?? [1, 0, 1]));   // magenta = unassigned id

  return {
    uVoxels:   { value: textures.voxelTex },
    uCoarse:   { value: textures.coarseTex },
    uSuper:    { value: textures.superTex },
    uLightTex: { value: null },                // set by the pipeline: the low-res light pass target
    uResLow:   { value: new THREE.Vector2(1, 1) },
    uAspect:   { value: 1 },
    uSize:     { value: new THREE.Vector3(world.size.x, world.size.y, world.size.z) },
    uCamPos:   { value: new THREE.Vector3() },
    uCamFwd:   { value: new THREE.Vector3(0, 0, -1) },
    uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    uCamUp:    { value: new THREE.Vector3(0, 1, 0) },
    uRes:      { value: new THREE.Vector2(1, 1) },
    uTanHalf:  { value: Math.tan(THREE.MathUtils.degToRad(FOV) / 2) },
    uTime:     { value: 0 },
    uLevels:   { value: DITHER_LEVELS },
    uAmbient:  { value: AMBIENT },
    uSoft:     { value: SOFT_SHADOW_M * vpm },
    uDither:   { value: DITHER_STRENGTH },
    uInvScale: { value: 1 / vpm },
    uBlock:    { value: BLOCK_VOXELS },
    uMarkerR:  { value: MARKER_RADIUS_M * vpm },
    uPalette:  { value: palette },
    uLightPos:   { value: lights.pos },
    uLightCol:   { value: lights.col },
    uLightCount: lights.count,                 // { value } owned by lights.update()
    uSunDir: { value: v3(sk.sunDir) }, uMoonDir: { value: v3(sk.moonDir) },
    uCelLightDir: { value: v3(sk.lightDir) }, uCelLightCol: { value: v3(sk.lightCol) },
    uSkyAmb: { value: v3(sk.skyAmb) }, uZenith: { value: v3(sk.zenith) }, uHorizon: { value: v3(sk.horizon) },
    uDusk: { value: v3(sk.dusk) }, uSunDisc: { value: v3(sk.sunDisc) },
    uNight: { value: sk.night }, uSkyRot: { value: new THREE.Vector2(...sk.rot) },
  };
}

// Push a sky state (from game/sky.js) into the sky uniforms.
export function applySkyUniforms(uniforms, st) {
  uniforms.uSunDir.value.set(...st.sunDir); uniforms.uMoonDir.value.set(...st.moonDir);
  uniforms.uCelLightDir.value.set(...st.lightDir); uniforms.uCelLightCol.value.set(...st.lightCol);
  uniforms.uSkyAmb.value.set(...st.skyAmb); uniforms.uZenith.value.set(...st.zenith); uniforms.uHorizon.value.set(...st.horizon);
  uniforms.uDusk.value.set(...st.dusk); uniforms.uSunDisc.value.set(...st.sunDisc);
  uniforms.uNight.value = st.night; uniforms.uSkyRot.value.set(...st.rot);
}

// Copy a THREE.PerspectiveCamera (which the orbit controls move, in metres) into the shader's camera uniforms (voxels).
const _right = new THREE.Vector3(), _up = new THREE.Vector3(), _back = new THREE.Vector3();
export function applyCameraUniforms(uniforms, camera, world) {
  camera.updateMatrixWorld();
  camera.matrixWorld.extractBasis(_right, _up, _back);
  world.toVoxel(camera.position, uniforms.uCamPos.value);
  uniforms.uCamRight.value.copy(_right);
  uniforms.uCamUp.value.copy(_up);
  uniforms.uCamFwd.value.copy(_back).negate();
  uniforms.uTanHalf.value = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
}
