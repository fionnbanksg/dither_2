import * as THREE from 'three';
import { POINT_LIGHTS } from '../config.js';

// Point lights: orbit + flicker, written into the arrays the shader reads (voxel coordinates, colour * intensity).
// Add torches / flashes by pushing more entries into POINT_LIGHTS (max 8, the shader's array size).
const MAX_LIGHTS = 8;
const hexRgb = (h) => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];

export function createLights(world) {
  if (POINT_LIGHTS.length > MAX_LIGHTS) console.warn(`POINT_LIGHTS has ${POINT_LIGHTS.length} entries; only the first ${MAX_LIGHTS} are used`);
  const cfgs = POINT_LIGHTS.slice(0, MAX_LIGHTS).map((c) => ({ ...c, rgb: hexRgb(c.color) }));
  const pos = Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3());
  const col = Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3());
  const count = { value: cfgs.length };    // used directly as the uLightCount uniform
  const m = { x: 0, y: 0, z: 0 };          // scratch: position in metres

  function update(tSec) {
    cfgs.forEach((c, i) => {
      const a = c.phase + tSec * c.speed;
      m.x = Math.cos(a) * c.radius; m.y = c.height; m.z = Math.sin(a) * c.radius;
      world.toVoxel(m, pos[i]);
      const flick = c.flicker ? 1 + c.flicker * Math.sin(tSec * 23 + c.phase) * Math.sin(tSec * 7.3) : 1;
      col[i].set(c.rgb[0], c.rgb[1], c.rgb[2]).multiplyScalar(c.intensity * flick);
    });
  }

  return { pos, col, count, update };
}
