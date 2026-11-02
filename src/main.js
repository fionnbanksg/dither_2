import * as THREE from 'three';
import {
  FOV, NEAR, FAR, SKY, VOXELS_PER_METRE, WORLD_SIZE_M, FLOOR_VOXELS,
} from './config.js';
import { createVoxelWorld } from './world/voxelWorld.js';
import { buildDemoWorld } from './world/buildDemo.js';
import { createWorldTextures } from './render/textures.js';
import { createUniforms, applySkyUniforms, applyCameraUniforms } from './render/uniforms.js';
import { createPipeline } from './render/pipeline.js';
import { createLights } from './game/lights.js';
import { createSky } from './game/sky.js';
import { createOrbitCamera } from './game/orbitCamera.js';
import { createDebugHud } from './game/debugHud.js';

// Startup + per-frame order only. Everything else lives in its own module (see ARCHITECTURE.md).
const canvas = document.getElementById('view');

const world = createVoxelWorld({ sizeM: WORLD_SIZE_M, voxelsPerMetre: VOXELS_PER_METRE, floorVoxels: FLOOR_VOXELS });
buildDemoWorld(world);
world.buildCoarse();

const textures = createWorldTextures(world);
const lights = createLights(world);
const sky = createSky(SKY);
const uniforms = createUniforms({ world, textures, lights, sky });
const pipeline = createPipeline({ canvas, uniforms });

const camera = new THREE.PerspectiveCamera(FOV, 1, NEAR, FAR);   // carries the orbit transform; the shader does the drawing
const orbit = createOrbitCamera(canvas, camera);
const hud = createDebugHud(document.getElementById('debug'), { pipeline, camera, uniforms, world, sky });

await pipeline.warmUp();

let last = performance.now();
pipeline.renderer.setAnimationLoop((now) => {
  const dt = now - last; last = now;
  const t = now / 1000;
  uniforms.uTime.value = t;
  sky.update(dt / 1000);
  applySkyUniforms(uniforms, sky.state());
  lights.update(t);
  orbit.update(dt);
  applyCameraUniforms(uniforms, camera, world);
  pipeline.render();
  hud.frame(dt);
});
