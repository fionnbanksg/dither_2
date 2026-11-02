export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Frame-rate-independent exponential smoothing. Moves `cur` toward `target` by a
// fraction that depends on elapsed time, not on how many frames ran, so the feel
// is identical at 30 and 144 fps. Higher rate = snappier; rate <= 0 disables it.
export function damp(cur, target, rate, dtSec) {
  if (!(rate > 0)) return target;
  return target + (cur - target) * Math.exp(-rate * dtSec);
}
