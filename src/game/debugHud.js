import { RENDER_SCALE } from '../config.js';
import { DebugOverlay } from '../ui/debug.js';

// Wires F3 + stats text to the overlay. frame(dtMs) is called every frame.
export function createDebugHud(el, { renderer, camera }) {
  let fps = 0;
  const overlay = new DebugOverlay(el, () => {
    const i = renderer.info.render;
    return [
      `fps   ${fps.toFixed(0)}`,
      `res   ${renderer.domElement.width}x${renderer.domElement.height} (x${RENDER_SCALE})`,
      `calls ${i.calls}  tris ${i.triangles}`,
      `cam   ${camera.position.toArray().map((v) => v.toFixed(1)).join(', ')}`,
    ].join('\n');
  });
  window.addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); overlay.toggle(); } });

  return { frame(dtMs) { fps += (1000 / Math.max(dtMs, 1) - fps) * 0.1; overlay.frame(dtMs); } };
}
