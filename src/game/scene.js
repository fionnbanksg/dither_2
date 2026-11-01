import * as THREE from 'three';
import { BG_COLOR, CUBE_SPIN } from '../config.js';

// Scene contents: background, cube, floor. update(dtMs) advances animation.
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 }),
  );
  cube.position.y = 0.5;
  cube.castShadow = true;
  scene.add(cube);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x444a55, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return { scene, update: (dtMs) => { cube.rotation.y += dtMs * CUBE_SPIN; } };
}
