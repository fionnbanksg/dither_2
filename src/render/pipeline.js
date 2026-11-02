// Render pipeline: the renderer, the two shader passes (low-res light pass + full-res pass), the light render
// target, and the internal resolution. Nothing scene-specific in here.
//
// The canvas always fills the window via CSS; only its *internal* resolution (window size x renderScale) changes,
// so lowering the scale just upscales more. Framing comes from the window's aspect ratio (uAspect), never from the
// internal size, so the image looks identical at every scale.

import * as THREE from 'three';
import { vert, frag } from '../shader.js';
import { RENDER_SCALE, RENDER_SCALE_MIN, RENDER_SCALE_MAX, HALF_RES_LIGHT, LIGHT_DIV } from '../config.js';
import { clamp } from '../util/math.js';

export function createPipeline({ canvas, uniforms }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);

  // Light pass: world traced at 1/LIGHT_DIV resolution into a float target; sky / sun / point-light rays are cast there once
  // per texel and the full-res pass reuses them (see fetchLight in shader/lighting.js). Needs float render targets.
  const useLightBuffer = HALF_RES_LIGHT && renderer.extensions.has('EXT_color_buffer_float');
  if (HALF_RES_LIGHT && !useLightBuffer) console.warn('EXT_color_buffer_float missing: light pass disabled, using per-pixel rays');

  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);   // unused by the shader; three wants one
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const makeQuad = (material) => {
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(quadGeo, material);
    quad.frustumCulled = false;
    scene.add(quad);
    return scene;
  };

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms, vertexShader: vert, fragmentShader: frag,
    defines: useLightBuffer ? { USE_LIGHT_BUFFER: 1 } : {},
    depthTest: false, depthWrite: false,
  });
  const scene = makeQuad(material);

  const lightRT = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.FloatType, format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthBuffer: false, stencilBuffer: false,
  });
  uniforms.uLightTex.value = lightRT.texture;
  // same uniforms (shared {value} objects, so sliders reach both passes), except its own resolution and no light texture
  // (it writes that texture, so it must not read it)
  const lightUniforms = { ...uniforms, uRes: { value: new THREE.Vector2(1, 1) }, uLightTex: { value: null } };
  const lightMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: lightUniforms, vertexShader: vert, fragmentShader: frag,
    defines: { LIGHT_PASS: 1 },
    depthTest: false, depthWrite: false,
  });
  const lightScene = makeQuad(lightMaterial);

  let renderScale = clamp(RENDER_SCALE, RENDER_SCALE_MIN, RENDER_SCALE_MAX);
  let dirty = true;
  const size = { width: 1, height: 1 };        // current internal resolution
  const lightSize = { width: 1, height: 1 };   // current light pass resolution
  const resizeListeners = new Set();           // future passes hook in here

  // Applied lazily at the start of a frame, so a slider firing many events between frames reallocates the buffers once.
  function applySize() {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const w = Math.max(1, Math.floor(vw * renderScale));
    const h = Math.max(1, Math.floor(vh * renderScale));
    renderer.setSize(w, h, false);             // false = keep CSS size; canvas is upscaled pixelated
    uniforms.uRes.value.set(w, h);
    uniforms.uAspect.value = vw / vh;
    const lw = Math.max(1, Math.ceil(w / LIGHT_DIV)), lh = Math.max(1, Math.ceil(h / LIGHT_DIV));
    lightRT.setSize(lw, lh);
    uniforms.uResLow.value.set(lw, lh);
    lightUniforms.uRes.value.set(lw, lh);
    size.width = w; size.height = h;
    lightSize.width = lw; lightSize.height = lh;
    resizeListeners.forEach((fn) => fn(w, h));
    dirty = false;
  }
  window.addEventListener('resize', () => { dirty = true; });
  applySize();

  hotMaterials.push(material, lightMaterial);
  return {
    renderer, size, lightSize, useLightBuffer,
    get renderScale() { return renderScale; },
    setRenderScale(s) {
      const next = clamp(s, RENDER_SCALE_MIN, RENDER_SCALE_MAX);
      if (next !== renderScale) { renderScale = next; dirty = true; }
    },
    // fn(width, height) runs on every internal-resolution change; returns an unsubscribe.
    onResize(fn) { resizeListeners.add(fn); return () => resizeListeners.delete(fn); },
    // Compile both shaders now instead of hitching on the first frame.
    async warmUp() {
      try {
        if (useLightBuffer) await renderer.compileAsync(lightScene, quadCamera);
        await renderer.compileAsync(scene, quadCamera);
      } catch (e) { console.warn('shader precompile failed', e); }
    },
    // light pass first (if enabled), then the full-res pass
    render() {
      if (dirty) applySize();
      if (useLightBuffer) {
        renderer.setRenderTarget(lightRT);
        renderer.render(lightScene, quadCamera);
        renderer.setRenderTarget(null);
      }
      renderer.render(scene, quadCamera);
    },
  };
}

// Vite hot-swap: edit anything under shader/ and see it live without reloading.
// (Lives at module level because Vite wants import.meta.hot.accept in a fixed form; createPipeline registers its materials here.)
const hotMaterials = [];
if (import.meta.hot) {
  import.meta.hot.accept('../shader.js', (mod) => {
    if (!mod) return;
    for (const m of hotMaterials) {
      m.vertexShader = mod.vert;
      m.fragmentShader = mod.frag;
      m.needsUpdate = true;
    }
  });
}
