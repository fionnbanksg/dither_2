// All tunable settings live here. (Shader performance knobs are separate: see shader/constants.js)

// ---- render quality
export const RENDER_SCALE = 0.5;          // default internal resolution multiplier (adjustable at runtime via the F3 slider)
export const RENDER_SCALE_MIN = 0.1, RENDER_SCALE_MAX = 1;
export const HALF_RES_LIGHT = true;       // shadow / light rays run at lower resolution and neighbouring pixels reuse them (false = per-pixel rays, slower)
export const LIGHT_DIV = 2;               // light pass resolution divisor (2 = half; the full pass still traces, AOs and dithers every pixel)
export const DITHER_LEVELS = 14;          // colour levels per channel (lower = grittier)
export const DITHER_STRENGTH = 0.7;       // 0 = flat banding, 1 = full Bayer pattern
export const AMBIENT = 0.07;              // flat ambient light strength

// ---- camera
export const FOV = 70;                    // vertical FOV, degrees
export const NEAR = 0.1, FAR = 100;       // only used by the camera object that carries the orbit transform
// smoothing: ease rates in 1/sec (higher = snappier, 0 = instant). zoomSens: log-zoom per wheel pixel.
export const ORBIT = {
  yaw: 0.8, pitch: 0.5, dist: 4, minDist: 1.5, maxDist: 12, minPitch: -0.1, maxPitch: 1.5,
  target: [0, 0.5, 0], sens: 0.005, zoomSens: 0.001,
  smoothing: { rotate: 14, zoom: 10 },
};

// ---- voxel world (see world/voxelWorld.js). Memory and ray cost grow with the cube of VOXELS_PER_METRE.
export const VOXELS_PER_METRE = 16;       // 16 -> 6 cm voxels
export const WORLD_SIZE_M = [12, 6, 12];  // volume the shader traces, in metres (rounded up to whole 8-voxel bricks)
export const FLOOR_VOXELS = 4;            // thickness of the floor slab; y = 0 m is the top of it
export const BLOCK_VOXELS = 4;            // size of the blocky colour-variation cells in voxels
export const SOFT_SHADOW_M = 0.8;         // point-light shadow softness: jitter radius in metres (0 = hard)

// ---- sky: time of day 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight (see game/sky.js)
export const SKY = { timeOfDay: 0.66, daySeconds: 0 };   // daySeconds 0 = frozen; the F3 slider moves it

// ---- point lights: orbit radius/height (metres), speed (rad/s), colour, intensity, flicker amount (0 = steady).
// At most 8. Every light casts real shadows; only the 4 strongest per pixel get a shadow ray (shader/constants.js).
export const MARKER_RADIUS_M = 0.07;      // size of the little glowing ball drawn at each light
export const POINT_LIGHTS = [
  { color: 0xff7a2a, intensity: 3.2, radius: 2.2, height: 1.2, speed: 0.6,  phase: 0,   flicker: 0.25 },
  { color: 0x3aa0ff, intensity: 2.4, radius: 3.0, height: 0.8, speed: -0.4, phase: 2.1, flicker: 0    },
  { color: 0x7dff9a, intensity: 2.0, radius: 1.6, height: 1.8, speed: 0.9,  phase: 4.2, flicker: 0.1  },
];
