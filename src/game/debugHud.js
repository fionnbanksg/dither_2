import { RENDER_SCALE_MIN, RENDER_SCALE_MAX } from '../config.js';
import { DebugOverlay } from '../ui/debug.js';

// Wires F3 + stats text + debug controls to the overlay. frame(dtMs) is called every frame.
export function createDebugHud(el, { pipeline, camera, uniforms, world, sky }) {
  const { renderer } = pipeline;
  let fps = 0;
  const overlay = new DebugOverlay(el, () => {
    const i = renderer.info.render;
    const { size, lightSize } = pipeline;
    return [
      `fps   ${fps.toFixed(0)}`,
      `res   ${size.width}x${size.height} (x${pipeline.renderScale.toFixed(2)})`,
      `light ${pipeline.useLightBuffer ? `${lightSize.width}x${lightSize.height}` : 'per-pixel'}`,
      `world ${world.size.x}x${world.size.y}x${world.size.z} vox (${(world.data.length / 1e6).toFixed(1)} MB)`,
      `lights ${uniforms.uLightCount.value}   calls ${i.calls}`,
      `cam   ${camera.position.toArray().map((v) => v.toFixed(1)).join(', ')}`,
    ].join('\n');
  });

  // Add further debug controls here as more settings become tweakable.
  overlay.addSlider({
    label: 'resolution', min: RENDER_SCALE_MIN, max: RENDER_SCALE_MAX, step: 0.01,
    value: pipeline.renderScale, format: (v) => `x${v.toFixed(2)}`,
    onInput: pipeline.setRenderScale,
  });
  overlay.addSlider({
    label: 'dither levels', min: 2, max: 32, step: 1,
    value: uniforms.uLevels.value, format: (v) => String(v),
    onInput: (v) => { uniforms.uLevels.value = v; },
  });
  overlay.addSlider({
    label: 'dither strength', min: 0, max: 1, step: 0.01,
    value: uniforms.uDither.value,
    onInput: (v) => { uniforms.uDither.value = v; },
  });
  overlay.addSlider({
    label: 'time of day', min: 0, max: 1, step: 0.005,
    value: sky.tod,
    format: (v) => { const h = (6 + v * 24) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; },
    onInput: sky.setTime,
  });

  window.addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); overlay.toggle(); } });

  return { frame(dtMs) { fps += (1000 / Math.max(dtMs, 1) - fps) * 0.1; overlay.frame(dtMs); } };
}
