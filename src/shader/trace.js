// GLSL part 4/8: ray traversal through the voxel world (3-level DDA) and shadow-ray occlusion.

export default /* glsl */`// ------------------------------------------------------------ tracing
struct Hit {
  bool  hit;
  int   id;
  ivec3 cell;
  float t;
  vec3  n;
};

Hit noHit() {
  Hit h;
  h.hit = false; h.id = 0; h.cell = ivec3(0); h.t = 1e9; h.n = vec3(0.0);
  return h;
}

// Two-level grid traversal. rd must be normalised.
// Outer loop walks 8^3 bricks; bricks that contain stone are walked voxel by voxel.
Hit trace(vec3 ro, vec3 rd, int maxCoarse, float maxT) {
  // Rays that start outside the volume (the orbiting camera, mostly) first travel to its bounding box.
  float tOff = 0.0;
  if (!(all(greaterThanEqual(ro, vec3(0.0))) && all(lessThan(ro, uSize)))) {
    vec3  i0 = 1.0 / rd;
    vec3  ta = -ro * i0, tb = (uSize - ro) * i0;
    vec3  tlo = min(ta, tb), thi = max(ta, tb);
    float tn = max(max(tlo.x, tlo.y), tlo.z);
    float tf = min(min(thi.x, thi.y), thi.z);
    if (tf <= max(tn, 0.0)) return noHit();           // misses the box, or it is behind the ray
    tOff = max(tn, 0.0) + 1e-3;
    if (tOff >= maxT) return noHit();
    ro = clamp(ro + rd * tOff, vec3(1e-4), uSize - 1e-4);
    maxT -= tOff;
  }
  vec3  stp  = sign(rd);
  vec3  inv  = 1.0 / rd;
  vec3  dlt  = abs(inv);
  float B    = float(BRICK);
  ivec3 csz  = ivec3(uSize) / BRICK;

  ivec3 cc     = ivec3(floor(ro / B));
  vec3  cside  = (vec3(cc) * B + (stp * 0.5 + 0.5) * B - ro) * inv;  // t when leaving each brick axis
  vec3  cdelta = dlt * B;
  vec3  cmask  = vec3(0.0);
  float tEnter = 0.0;
  ivec3 sSize  = textureSize(uSuper, 0);
  float SB     = B * 4.0;                                            // voxels per third-level block edge

  for (int i = 0; i < maxCoarse; i++) {
    if (any(lessThan(cc, ivec3(0))) || any(greaterThanEqual(cc, csz))) break;

    if (texelFetch(uCoarse, cc, 0).r > 0.0) {
      ivec3 lo   = cc * BRICK;
      vec3  p    = ro + rd * (tEnter + 1e-3);
      ivec3 cell = clamp(ivec3(floor(p)), lo, lo + (BRICK - 1));
      vec3  side = (stp * (vec3(cell) - ro + 0.5) + 0.5) * dlt;
      vec3  fmask = cmask;

      for (int j = 0; j < 3 * BRICK; j++) {
        int id = voxelAt(cell);
        if (id > 0) {
          Hit h;
          h.hit = true; h.id = id; h.cell = cell;
          h.t = dot(fmask, side - dlt) + tOff;
          h.n = -fmask * stp;
          return h;
        }
        fmask = step(side, side.yzx) * step(side, side.zxy);
        side += fmask * dlt;
        cell += ivec3(fmask * stp);
        if (any(lessThan(cell, lo)) || any(greaterThanEqual(cell, lo + BRICK))) break;
      }
    } else {
      // empty brick: if its whole 4x4x4-brick block is empty too, hop straight out of the block
      ivec3 sc = cc >> 2;
      if (USE_SUPER && all(lessThan(sc, sSize)) && texelFetch(uSuper, sc, 0).r <= 0.0) {
        vec3  sx   = (vec3(sc) * SB + (stp * 0.5 + 0.5) * SB - ro) * inv;   // t when leaving the block on each axis
        vec3  sm   = step(sx, sx.yzx) * step(sx, sx.zxy);
        float tOut = dot(sm, sx);
        ivec3 nc   = ivec3(floor((ro + rd * (tOut + 1e-3)) / B));
        if (any(notEqual(nc >> 2, sc))) {                          // really left the block (guards float edge cases)
          if (tOut > maxT) break;
          cc = nc; cmask = sm; tEnter = tOut;
          cside = (vec3(cc) * B + (stp * 0.5 + 0.5) * B - ro) * inv;
          continue;
        }
      }
    }

    cmask  = step(cside, cside.yzx) * step(cside, cside.zxy);
    tEnter = dot(cmask, cside);
    cside += cmask * cdelta;
    cc    += ivec3(cmask * stp);
    if (tEnter > maxT) break;
  }
  return noHit();
}

// Shadow ray: true if anything solid lies between ro and ro + rd * dist.
bool occluded(vec3 ro, vec3 rd, float dist) {
  Hit h = trace(ro, rd, SHADOW_COARSE, dist);
  return h.hit && h.t < dist;
}

`;
