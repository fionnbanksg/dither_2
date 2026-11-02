// GLSL part 7/8: a small glowing ball drawn at each point light, so you can see where the lights are.
// Analytic ray-sphere tests (at most 8), not voxels, so they move smoothly.

export default /* glsl */`// ------------------------------------------------------------ light markers
// Nearest marker in front of tMax. Returns its index in idx (-1 = none).
bool traceMarkers(vec3 ro, vec3 rd, float tMax, out int idx) {
  float best = tMax;
  idx = -1;
  for (int i = 0; i < 8; i++) {
    if (i >= uLightCount) break;
    vec3  oc = ro - uLightPos[i];
    float b  = dot(oc, rd);
    float d  = b * b - (dot(oc, oc) - uMarkerR * uMarkerR);
    if (d < 0.0) continue;
    float t = -b - sqrt(d);
    if (t > 0.0 && t < best) { best = t; idx = i; }
  }
  return idx >= 0;
}

vec3 markerColour(int i) {
  vec3 c = uLightCol[i];
  return c / max(max(c.r, max(c.g, c.b)), 1e-3) * 1.1;
}

`;
