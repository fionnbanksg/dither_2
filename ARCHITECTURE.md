# dither_2 architecture

A voxel ray tracer. Three.js is only the WebGL host: it owns the canvas and draws one fullscreen quad per pass.
Everything you see is traced in a fragment shader through a 3D texture of voxels, then quantised with an 8x8 Bayer dither.

## Where to look
| I want to change... | open |
|---|---|
| render quality, dither, FOV, world size / voxel density, sky time, lights, camera feel | `config.js` |
| the scene (what is in the world) | `world/buildDemo.js` |
| materials / colours | `world/palette.js` (add an id in `MAT`, a colour in `PALETTE`) |
| how the voxel grid is stored / filled | `world/voxelWorld.js` |
| how things look (lighting, sky, fog, AO) | `shader/*.js` |
| shader perf knobs (ray budgets, light budget) | `shader/constants.js` |
| add a shader uniform | declare in `shader/uniforms.js`, give it a value in `render/uniforms.js` |
| renderer, render targets, internal resolution | `render/pipeline.js` |
| GPU textures for the world | `render/textures.js` |
| point lights (orbit, flicker, colour) | `game/lights.js` + `POINT_LIGHTS` in `config.js` |
| day / night | `game/sky.js` |
| orbit camera + smoothing | `game/orbitCamera.js`, `util/math.js` |
| F3 overlay and its sliders | `game/debugHud.js` (what is shown), `ui/debug.js` (widgets) |
| startup + per-frame order | `main.js` |

## Frame
`sky -> lights -> camera -> (pipeline) light pass at 1/LIGHT_DIV res -> full pass -> HUD`

The light pass casts the sun / sky / point-light shadow rays once per low-res texel. The full pass traces every pixel,
computes AO and albedo itself, and reuses the nearest light-pass texels that saw the same face at a similar distance.

## Shader files (`shader.js` joins them; GLSL needs declare-before-use, so don't reorder)
`vert` -> `uniforms` -> `constants` -> `helpers` -> `trace` -> `surface` -> `lighting` -> `markers` -> `entry`

## Units
Game code works in **metres** (x/z centred on the world, y = 0 at the top of the floor). The shader works in **voxels**.
`world.toVoxel()` is the only conversion. `VOXELS_PER_METRE` sets the density; cost grows with its cube.

## Resolution
The canvas always fills the window; internal size = window x `pipeline.renderScale`. Camera framing uses the window aspect
(`uAspect`), so every scale frames identically. Anything that owns a render target subscribes with `pipeline.onResize(fn)`.

## Not (yet) here
Editing voxels at runtime (explosions etc.): the old project has `uploadBox` in its `render/textures.js` (partial GPU upload)
and `refreshSuper(box)` is already returned by `createWorldTextures`. Shapes that rotate (the old spinning cube) need to be
re-voxelised each frame because the grid is axis-aligned.
