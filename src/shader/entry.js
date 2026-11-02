// GLSL part 8/8: main() entry points. LIGHT_PASS = low-res light pass, else the full-res pass.
// The #ifdef/#endif pairs in here must stay balanced.

export default /* glsl */`// ------------------------------------------------------------ main
#ifdef LIGHT_PASS
// Light pass: trace the world at (resolution / LIGHT_DIV) and cast the sky / sun / light rays there, once per texel.
// Output: rgb = sun + point lights (albedo 1, no AO); a = (faceCode * 2 + skyVisible) * 8192 + hitDistance.
// The full-res pass reuses a texel for every pixel that sees the same kind of surface at a similar distance.
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv.x *= uAspect;

  vec3 ro = uCamPos;
  vec3 rd = safeDir(uCamFwd + (uCamRight * uv.x + uCamUp * uv.y) * uTanHalf);

  vec4 o = vec4(0.0, 0.0, 0.0, 14.0 * 8192.0);              // face code 7 = nothing to reuse (sky)
  Hit h = trace(ro, rd, MAX_COARSE, 1e5);
  if (h.hit) {
    float vis;
    vec3 E = castLights(ro + rd * h.t, h.n, vis);
    o = vec4(E, (faceCode(h.n) * 2.0 + vis) * 8192.0 + min(h.t, 8000.0));
  }
  fragColor = o;
}
#else
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv.x *= uAspect;

  vec3 ro = uCamPos;
  vec3 rd = safeDir(uCamFwd + (uCamRight * uv.x + uCamUp * uv.y) * uTanHalf);

  gSky = 0.0;
  Hit h = trace(ro, rd, MAX_COARSE, 1e5);
  int mi;
  vec3 col;

  if (traceMarkers(ro, rd, h.hit ? h.t : 1e9, mi)) {
    col = markerColour(mi);                                // a light's glowing ball is in front of the world
  } else if (!h.hit) {
    col = sky(rd);
  } else {
    vec3 p = ro + rd * h.t;
    vec3 alb = albedo(h.id, h.cell);
    float ao = faceAO(h.cell, h.n, p);

    float vis; vec3 E;
#ifdef USE_LIGHT_BUFFER
    bool reuse = fetchLight(h.t, h.n, E, vis);             // borrow the low-res light pass
#else
    bool reuse = false;
#endif
    if (!reuse) E = castLights(p, h.n, vis);               // silhouettes, or buffer disabled
    gSky = vis;
    col = applyFog(shadeLit(p, h.n, alb, ao, E, vis), h.t);
  }

  // tone + ordered dither
  col = pow(max(col, 0.0), vec3(0.6));
  float b = bayer8(ivec2(gl_FragCoord.xy));
  col = floor(col * (uLevels - 1.0) + 0.5 + (b - 0.5) * uDither) / (uLevels - 1.0);
  col = clamp(col, 0.0, 1.0);

  fragColor = vec4(col, 1.0);
}
#endif
`;
