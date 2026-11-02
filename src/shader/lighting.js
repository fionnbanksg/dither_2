// GLSL part 6/8: lighting: point lights, shadow rays (castLights), shading, half-res light buffer fetch.

export default /* glsl */`// ------------------------------------------------------------ lighting
// Unshadowed strength of light i at a surface (max channel), used to cull / rank lights before any ray is cast.
float lightLum(int i, vec3 sp, vec3 n) {
  vec3  L = uLightPos[i] - sp;
  float d = length(L);
  float ndl = max(dot(n, L / d), 0.0);
  float du  = d * uInvScale;
  vec3  c = uLightCol[i] * ndl / (1.0 + 0.07 * du * du);
  return max(c.r, max(c.g, c.b));
}

// The ray-casting half of the lighting, evaluated with albedo = 1 and no AO so it does not depend on the pixel's own
// material: sky visibility (vis, 0 or 1) plus the sun / moon and point-light terms (returned).
// The half-res light pass stores exactly this and neighbouring full-res pixels reuse it (see fetchLight).
vec3 castLights(vec3 p, vec3 n, out float vis) {
  vec3 E = vec3(0.0);
  vec3 sp = p + n * 0.3;                                    // shadow ray origin

  // open sky: ambient from above (only where the sky can be seen) + one sun / moon shadow ray
  vec3 sj = vec3(hash13(vec3(gl_FragCoord.xy, 41.0)), hash13(vec3(gl_FragCoord.xy, 43.0)), hash13(vec3(gl_FragCoord.xy, 47.0))) - 0.5;
  vis = occluded(sp, safeDir(vec3(0.0, 0.9, 0.0) + n * 0.5 + sj * 0.8), 700.0) ? 0.0 : 1.0;
  float sn = max(dot(n, uCelLightDir), 0.0);
  if (sn > 0.0 && max(uCelLightCol.r, max(uCelLightCol.g, uCelLightCol.b)) > 0.004 &&
      !(vis == 0.0 && uCelLightDir.y > SUN_SKIP_Y) &&
      !occluded(sp, safeDir(uCelLightDir + sj * 0.05), 900.0)) {
    E += uCelLightCol * sn;
  }

  // cheap pass first: how strong is each light here? (no rays)
  float lum[8];
  for (int i = 0; i < 8; i++) lum[i] = (i < uLightCount) ? lightLum(i, sp, n) : 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= uLightCount) break;
    if (lum[i] < LIGHT_CUTOFF) continue;
    int rank = 0;                                             // how many lights beat this one
    for (int j = 0; j < 8; j++) rank += int(lum[j] > lum[i] || (lum[j] == lum[i] && j < i));
    if (rank >= MAX_SHADOW_LIGHTS) continue;

    vec3  L = uLightPos[i] - sp;
    float d = length(L);
    L /= d;
    float ndl = max(dot(n, L), 0.0);
    float du  = d * uInvScale;
    float att = 1.0 / (1.0 + 0.07 * du * du);
    vec3  contrib = uLightCol[i] * ndl * att;

    // jitter the light position per pixel; the dither hides the noise
    vec3 jit = vec3(
      hash13(vec3(gl_FragCoord.xy, 1.0 + float(i))),
      hash13(vec3(gl_FragCoord.xy, 7.0 + float(i))),
      hash13(vec3(gl_FragCoord.xy, 13.0 + float(i)))) - 0.5;
    vec3  target = uLightPos[i] + jit * (i == HARD_SHADOW_LIGHT ? 0.0 : uSoft * SOFT_SCALE);
    if (solidAt(ivec3(floor(target)))) target = uLightPos[i];     // never aim a shadow ray into stone
    vec3  sd = target - sp;
    float sl = length(sd);
    if (occluded(sp, safeDir(sd), sl - 0.05)) continue;

    E += contrib;
  }
  return E;
}

// The material half: ambient + sky + (sun + lights) tinted by albedo and occlusion.
vec3 shadeLit(vec3 p, vec3 n, vec3 alb, float ao, vec3 E, float vis) {
  vec3 lit = alb * vec3(0.6, 0.7, 1.0) * uAmbient * ao;
  lit += alb * uSkyAmb * vis * (0.55 + 0.45 * n.y) * mix(1.0, ao, 0.7);
  lit += alb * E * mix(1.0, ao, 0.6);
  return lit;
}

// 0..5 for the six axis-aligned face directions (compared as floats so it can be packed into the light texture)
float faceCode(vec3 n) {
  return n.x > 0.5 ? 0.0 : (n.x < -0.5 ? 1.0 : (n.y > 0.5 ? 2.0 : (n.y < -0.5 ? 3.0 : (n.z > 0.5 ? 4.0 : 5.0))));
}

#ifdef USE_LIGHT_BUFFER
// Reuse the half-res light pass: bilinear over the 4 nearest texels, counting only texels that saw the same face
// direction at a similar distance (so light never bleeds across an edge). Returns false when none qualify
// (silhouettes, thin geometry): the caller then casts its own rays.
bool fetchLight(float t, vec3 n, out vec3 E, out float vis) {
  vec2  S  = uRes / uResLow;
  vec2  f  = gl_FragCoord.xy / S - 0.5;
  vec2  f0 = floor(f);
  vec2  fr = f - f0;
  ivec2 i0 = ivec2(f0);
  ivec2 lim = ivec2(uResLow) - 1;
  float code = faceCode(n);
  float tol  = 2.0 + 0.08 * t;
  vec3  eSum = vec3(0.0);
  float vSum = 0.0, wSum = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 o = ivec2(k & 1, k >> 1);
    float w = ((o.x == 1) ? fr.x : 1.0 - fr.x) * ((o.y == 1) ? fr.y : 1.0 - fr.y);
    vec4  d = texelFetch(uLightTex, clamp(i0 + o, ivec2(0), lim), 0);
    float kk = floor(d.a / 8192.0);
    float tk = d.a - kk * 8192.0;
    if (floor(kk * 0.5) != code || abs(tk - t) > tol) continue;
    eSum += d.rgb * w;
    vSum += mod(kk, 2.0) * w;
    wSum += w;
  }
  if (wSum < 1e-3) return false;
  E = eSum / wSum;
  vis = vSum / wSum;
  return true;
}
#endif

`;
