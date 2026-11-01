import { ORBIT } from '../config.js';

// Dependency-free orbit controls: drag to rotate, wheel to zoom.
export function createOrbitCamera(canvas, camera) {
  const o = { yaw: ORBIT.yaw, pitch: ORBIT.pitch, dist: ORBIT.dist };
  const [tx, ty, tz] = ORBIT.target;
  let dragging = false;

  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    o.yaw -= e.movementX * ORBIT.sens;
    o.pitch = Math.max(-0.1, Math.min(1.5, o.pitch + e.movementY * ORBIT.sens));
  });
  canvas.addEventListener('wheel', (e) => {
    o.dist = Math.max(ORBIT.minDist, Math.min(ORBIT.maxDist, o.dist * (1 + Math.sign(e.deltaY) * 0.1)));
  }, { passive: true });

  return {
    update() {
      const cp = Math.cos(o.pitch);
      camera.position.set(tx + Math.sin(o.yaw) * cp * o.dist, ty + Math.sin(o.pitch) * o.dist, tz + Math.cos(o.yaw) * cp * o.dist);
      camera.lookAt(tx, ty, tz);
    },
  };
}
