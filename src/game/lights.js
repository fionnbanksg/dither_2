import * as THREE from 'three';
import { SHADOW_MAP_SIZE, POINT_LIGHTS } from '../config.js';

// Sun (shadowed) + dim hemisphere fill. Add torches/flashes here later.
export function createLights(scene) {
  scene.add(new THREE.HemisphereLight(0x8899bb, 0x221a14, 0.4));

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.5);
  sun.position.set(3, 5, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 15 });
  scene.add(sun);

  // point lights, each with a small emissive marker so you can see where it is
  const markerGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const points = POINT_LIGHTS.map((cfg) => {
    const light = new THREE.PointLight(cfg.color, cfg.intensity, 0, 2);
    light.castShadow = cfg.shadow;
    if (cfg.shadow) { light.shadow.mapSize.set(512, 512); light.shadow.bias = -0.002; }
    light.add(new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: cfg.color })));
    scene.add(light);
    return { cfg, light };
  });

  function update(tSec) {
    for (const { cfg, light } of points) {
      const a = cfg.phase + tSec * cfg.speed;
      light.position.set(Math.cos(a) * cfg.radius, cfg.height, Math.sin(a) * cfg.radius);
      const flick = cfg.flicker ? 1 + cfg.flicker * (Math.sin(tSec * 23 + cfg.phase) * Math.sin(tSec * 7.3) ) : 1;
      light.intensity = cfg.intensity * flick;
    }
  }

  return { sun, update };
}
