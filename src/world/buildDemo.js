import { MAT } from './palette.js';

// The demo scene, in metres: a floor slab, the cube, and four pillars to catch the orbiting lights' shadows.
// Swap this file's contents (or add siblings) to build a different world; nothing else needs to change.
export function buildDemoWorld(world) {
  const { boxM, size, voxelsPerMetre: vpm } = world;

  // floor: 10 m x 10 m slab filling y from the bottom of the volume up to y = 0 m
  const half = 5;
  const floorTop = world.toVoxel({ x: 0, y: 0, z: 0 }).y;
  world.fillBox(
    Math.round(size.x / 2 - half * vpm), 0, Math.round(size.z / 2 - half * vpm),
    Math.round(size.x / 2 + half * vpm), floorTop, Math.round(size.z / 2 + half * vpm), MAT.FLOOR);

  // the cube
  boxM([-0.5, 0, -0.5], [0.5, 1, 0.5], MAT.CUBE);

  // pillars with a slightly wider cap
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const x = sx * 3.6, z = sz * 3.6;
    boxM([x - 0.25, 0, z - 0.25], [x + 0.25, 2, z + 0.25], MAT.STONE);
    boxM([x - 0.35, 2, z - 0.35], [x + 0.35, 2.12, z + 0.35], MAT.STONE);
  }
}
