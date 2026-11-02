// Voxel material ids -> base colours. 0 = air (never drawn). The shader's palette array holds 12 entries.
export const MAT = { AIR: 0, FLOOR: 1, CUBE: 2, STONE: 3 };

export const PALETTE = [
  [0.00, 0.00, 0.00], // 0 air
  [0.27, 0.29, 0.33], // 1 floor
  [0.80, 0.80, 0.80], // 2 cube
  [0.62, 0.60, 0.56], // 3 stone
];
export const PALETTE_SIZE = 12;   // must match `uniform vec3 uPalette[12]` in shader/uniforms.js
