import { ORBIT } from '../config.js';
import { clamp, damp } from '../util/math.js';

// Dependency-free orbit controls with smoothing. Input only moves a *target*
// (yaw/pitch/dist); update(dtMs) eases the camera toward it.
export function createOrbitCamera(canvas, camera) {
  const target = { yaw: ORBIT.yaw, pitch: ORBIT.pitch, dist: ORBIT.dist };
  const cur = { ...target };
  const [tx, ty, tz] = ORBIT.target;
  let dragging = false;

  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    target.yaw -= e.movementX * ORBIT.sens;
    target.pitch = clamp(target.pitch + e.movementY * ORBIT.sens, ORBIT.minPitch, ORBIT.maxPitch);
  });
  canvas.addEventListener('wheel', (e) => {
    const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;   // Firefox reports lines, not pixels
    target.dist = clamp(target.dist * Math.exp(px * ORBIT.zoomSens), ORBIT.minDist, ORBIT.maxDist);
  }, { passive: true });

  return {
    update(dtMs) {
      const dt = dtMs / 1000;
      cur.yaw = damp(cur.yaw, target.yaw, ORBIT.smoothing.rotate, dt);
      cur.pitch = damp(cur.pitch, target.pitch, ORBIT.smoothing.rotate, dt);
      // zoom eases in log space so it feels the same whether close or far
      cur.dist = Math.exp(damp(Math.log(cur.dist), Math.log(target.dist), ORBIT.smoothing.zoom, dt));

      const cp = Math.cos(cur.pitch);
      camera.position.set(
        tx + Math.sin(cur.yaw) * cp * cur.dist,
        ty + Math.sin(cur.pitch) * cur.dist,
        tz + Math.cos(cur.yaw) * cp * cur.dist,
      );
      camera.lookAt(tx, ty, tz);
    },
  };
}
