import { RENDER_SCALE_MIN, RENDER_SCALE_MAX } from '../config.js';
import { DebugOverlay } from '../ui/debug.js';

// Wires F3 + stats text + debug controls to the overlay. frame(dtMs) is called every frame.
export function createDebugHud(el, pipeline) {
  const { renderer, camera } = pipeline;
  let fps = 0;
  const overlay = new DebugOverlay(el, () => {
    const i = renderer.info.render;
    return [
      `fps   ${fps.toFixed(0)}`,
      `res   ${renderer.domElement.width}x${renderer.domElement.height} (x${pipeline.renderScale.toFixed(2)})`,
      `calls ${i.calls}  tris ${i.triangles}`,
      `cam   ${camera.position.toArray().map((v) => v.toFixed(1)).join(', ')}`,
    ].join('\n');
  });

  // Add further debug controls here as more settings become tweakable.
  overlay.addSlider({
    label: 'resolution', min: RENDER_SCALE_MIN, max: RENDER_SCALE_MAX, step: 0.01,
    value: pipeline.renderScale, format: (v) => `x${v.toFixed(2)}`,
    onInput: pipeline.setRenderScale,
  });

  window.addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); overlay.toggle(); } });

  return { frame(dtMs) { fps += (1000 / Math.max(dtMs, 1) - fps) * 0.1; overlay.frame(dtMs); } };
}
