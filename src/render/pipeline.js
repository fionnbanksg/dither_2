import * as THREE from 'three';
import { RENDER_SCALE, FOV, NEAR, FAR } from '../config.js';

// Renderer + camera + resize. Nothing scene-specific in here.
export function createPipeline(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(FOV, 1, NEAR, FAR);

  function resize() {
    const w = Math.max(1, Math.floor(window.innerWidth * RENDER_SCALE));
    const h = Math.max(1, Math.floor(window.innerHeight * RENDER_SCALE));
    renderer.setSize(w, h, false);   // keep CSS size; canvas is upscaled pixelated
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, camera, resize, render: (scene) => renderer.render(scene, camera) };
}
