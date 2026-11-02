// All tunable settings live here.
export const RENDER_SCALE = 0.5;          // default internal resolution multiplier (adjustable at runtime via F3 slider)
export const RENDER_SCALE_MIN = 0.1, RENDER_SCALE_MAX = 1;
export const FOV = 70;
export const NEAR = 0.1, FAR = 100;
export const BG_COLOR = 0x0b0d12;
export const SHADOW_MAP_SIZE = 1024;
// smoothing: ease rates in 1/sec (higher = snappier, 0 = instant). zoomSens: log-zoom per wheel pixel.
export const ORBIT = {
  yaw: 0.8, pitch: 0.5, dist: 4, minDist: 1.5, maxDist: 12, minPitch: -0.1, maxPitch: 1.5,
  target: [0, 0.5, 0], sens: 0.005, zoomSens: 0.001,
  smoothing: { rotate: 14, zoom: 10 },
};
export const CUBE_SPIN = 0.0005;          // rad per ms

// Point lights: orbit radius/height/speed (rad/s), colour, intensity, flicker amount (0 = steady).
// Only lights with shadow:true cast shadows (point-light shadows are expensive).
export const POINT_LIGHTS = [
  { color: 0xff7a2a, intensity: 12, radius: 2.2, height: 1.2, speed: 0.6,  phase: 0,   flicker: 0.25, shadow: true },
  { color: 0x3aa0ff, intensity: 8,  radius: 3.0, height: 0.8, speed: -0.4, phase: 2.1, flicker: 0,    shadow: false },
  { color: 0x7dff9a, intensity: 6,  radius: 1.6, height: 1.8, speed: 0.9,  phase: 4.2, flicker: 0.1,  shadow: false },
];
