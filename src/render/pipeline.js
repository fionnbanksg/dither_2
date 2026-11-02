import * as THREE from 'three';
import { RENDER_SCALE, RENDER_SCALE_MIN, RENDER_SCALE_MAX, FOV, NEAR, FAR } from '../config.js';
import { clamp } from '../util/math.js';

// Renderer + camera + internal resolution. Nothing scene-specific in here.
//
// The canvas always fills the window via CSS; only its *internal* resolution
// (window size x renderScale) changes, so lowering the scale just upscales more.
// Camera framing is derived from the window, never from the internal size, so the
// image looks identical at every scale.
export function createPipeline(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(FOV, 1, NEAR, FAR);

  let renderScale = clamp(RENDER_SCALE, RENDER_SCALE_MIN, RENDER_SCALE_MAX);
  let dirty = true;
  const size = { width: 1, height: 1 };   // current internal resolution
  const resizeListeners = new Set();       // future passes (dither targets etc.) hook in here

  // Applied lazily at the start of a frame, so a slider firing many events
  // between frames still only reallocates the buffer once.
  function applySize() {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const w = Math.max(1, Math.floor(vw * renderScale));
    const h = Math.max(1, Math.floor(vh * renderScale));
    renderer.setSize(w, h, false);          // false = keep CSS size; canvas is upscaled pixelated
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    size.width = w; size.height = h;
    resizeListeners.forEach((fn) => fn(w, h));
    dirty = false;
  }
  window.addEventListener('resize', () => { dirty = true; });
  applySize();

  return {
    renderer, camera, size,
    get renderScale() { return renderScale; },
    setRenderScale(s) {
      const next = clamp(s, RENDER_SCALE_MIN, RENDER_SCALE_MAX);
      if (next !== renderScale) { renderScale = next; dirty = true; }
    },
    // fn(width, height) runs on every internal-resolution change; returns an unsubscribe.
    onResize(fn) { resizeListeners.add(fn); return () => resizeListeners.delete(fn); },
    render(scene) {
      if (dirty) applySize();
      renderer.render(scene, camera);
    },
  };
}
