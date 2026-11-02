// The voxel grid the shader traces: one byte per voxel (material id), plus a coarse occupancy grid
// (1 = this 8^3 brick contains something) that lets rays skip empty space.
//
// Coordinates: the game and camera work in METRES, x/z centred on the volume, y = 0 at the top of the floor slab.
// The grid itself is in VOXELS (x fastest: index = x + size.x * (y + size.y * z)). toVoxel() converts.

export const BRICK = 8;   // coarse brick edge in voxels (the shader has the same constant)

export function createVoxelWorld({ sizeM, voxelsPerMetre, floorVoxels }) {
  const vpm = voxelsPerMetre;
  const round = (m) => Math.max(1, Math.ceil((m * vpm) / BRICK)) * BRICK;
  const size = { x: round(sizeM[0]), y: round(sizeM[1]), z: round(sizeM[2]) };
  const data = new Uint8Array(size.x * size.y * size.z);
  const coarseSize = { x: size.x / BRICK, y: size.y / BRICK, z: size.z / BRICK };
  const coarse = new Uint8Array(coarseSize.x * coarseSize.y * coarseSize.z);
  const origin = { x: size.x / 2, y: floorVoxels, z: size.z / 2 };   // voxel coords of metre (0, 0, 0)

  // metres -> voxels. `m` and `out` need x/y/z fields (THREE.Vector3 works).
  function toVoxel(m, out = {}) {
    out.x = origin.x + m.x * vpm; out.y = origin.y + m.y * vpm; out.z = origin.z + m.z * vpm;
    return out;
  }

  // Fill the half-open voxel box [x0,x1) x [y0,y1) x [z0,z1) with material `id`.
  function fillBox(x0, y0, z0, x1, y1, z1, id) {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); z0 = Math.max(0, z0);
    x1 = Math.min(size.x, x1); y1 = Math.min(size.y, y1); z1 = Math.min(size.z, z1);
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) {
      let i = x0 + size.x * (y + size.y * z);
      for (let x = x0; x < x1; x++, i++) data[i] = id;
    }
  }

  // Same, with the corners given in metres: boxM([x,y,z], [x,y,z], id).
  function boxM(min, max, id) {
    const a = toVoxel({ x: min[0], y: min[1], z: min[2] });
    const b = toVoxel({ x: max[0], y: max[1], z: max[2] });
    fillBox(Math.round(a.x), Math.round(a.y), Math.round(a.z), Math.round(b.x), Math.round(b.y), Math.round(b.z), id);
  }

  // Recompute the whole coarse grid from `data`. Call once after the world is built.
  function buildCoarse() {
    const { x: cx, y: cy, z: cz } = coarseSize;
    for (let bz = 0; bz < cz; bz++) for (let by = 0; by < cy; by++) for (let bx = 0; bx < cx; bx++) {
      let any = 0;
      for (let z = bz * BRICK; z < bz * BRICK + BRICK && !any; z++)
        for (let y = by * BRICK; y < by * BRICK + BRICK && !any; y++) {
          let i = bx * BRICK + size.x * (y + size.y * z);
          for (let x = 0; x < BRICK; x++, i++) if (data[i] !== 0) { any = 1; break; }
        }
      coarse[bx + cx * (by + cy * bz)] = any;
    }
  }

  return { size, data, coarse, coarseSize, voxelsPerMetre: vpm, toVoxel, fillBox, boxM, buildCoarse };
}
