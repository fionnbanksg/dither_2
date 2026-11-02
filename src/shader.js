// Voxel raytracer: three-level grid traversal (super blocks, 8^3 bricks, voxels) -> per-voxel AO + variation
// -> shadow rays (jittered for soft shadows) -> fog -> Bayer dither.
// Rendered at a low internal resolution and upscaled with nearest-neighbour by CSS.
//
// This file only ASSEMBLES the shader. The GLSL itself lives in ./shader/*.js, one file per topic.
// ORDER MATTERS: GLSL needs a function declared before it is used, so keep the list below in this order.

import vertSrc from './shader/vert.js';
import uniforms from './shader/uniforms.js';
import constants from './shader/constants.js';
import helpers from './shader/helpers.js';
import trace from './shader/trace.js';
import surface from './shader/surface.js';
import lighting from './shader/lighting.js';
import markers from './shader/markers.js';
import entry from './shader/entry.js';

export const vert = vertSrc;

export const frag = [uniforms, constants, helpers, trace, surface, lighting, markers, entry].join('');
