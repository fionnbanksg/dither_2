import { createPipeline } from './render/pipeline.js';
import { createScene } from './game/scene.js';
import { createLights } from './game/lights.js';
import { createOrbitCamera } from './game/orbitCamera.js';
import { createDebugHud } from './game/debugHud.js';

// Startup + per-frame order only. Everything else lives in its own module.
const canvas = document.getElementById('view');
const pipeline = createPipeline(canvas);
const world = createScene();
const lights = createLights(world.scene);
const orbit = createOrbitCamera(canvas, pipeline.camera);
const hud = createDebugHud(document.getElementById('debug'), pipeline);

let last = performance.now();
pipeline.renderer.setAnimationLoop((now) => {
  const dt = now - last; last = now;
  world.update(dt);
  lights.update(now / 1000);
  orbit.update();
  pipeline.render(world.scene);
  hud.frame(dt);
});
