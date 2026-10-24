// ==========================================================
// DANEDIT – 3D-Modelle (STL) mit three.js drehen lassen
// <div data-model="modelle/x.stl" data-color="#34c759" data-scroll data-fit="0.85">
//   data-scroll: Drehung folgt dem Scrollen, sonst dreht es sich von selbst
//   data-fit: Kameraabstand (kleiner = Modell größer), Standard 1.02
// ==========================================================
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const cache = {};
const load = (url) => (cache[url] ??= new STLLoader().loadAsync(url));

document.querySelectorAll("[data-model]").forEach(async (stage) => {
  const canvas = document.createElement("canvas");
  stage.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  // Weiches Studiolicht wie auf Produktfotos
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);

  // Modell laden, aufrichten (3MF: Z oben, three.js: Y oben) und zentrieren
  const geo = (await load(stage.dataset.model)).clone();
  geo.rotateX(-Math.PI / 2);
  geo.center();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    color: stage.dataset.color || "#34c759",
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
  }));
  const pivot = new THREE.Group();
  pivot.add(mesh);
  scene.add(pivot);

  // Kamera so weit weg, dass das Modell immer ganz ins Bild passt
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
  const radius = geo.boundingSphere.radius;
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = (radius / Math.sin(Math.min(vFov, hFov) / 2)) * (parseFloat(stage.dataset.fit) || 1.02);
    camera.position.set(0, radius * 0.3, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  // Scroll-Modelle nur neu zeichnen, wenn sich etwas geändert hat (schont den Akku)
  const scrollMode = "scroll" in stage.dataset;
  let dirty = true;
  if (scrollMode) addEventListener("scroll", () => (dirty = true), { passive: true });
  addEventListener("resize", () => { resize(); dirty = true; });
  resize();

  // Nur rendern, solange es sichtbar ist
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true; }).observe(stage);

  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || (scrollMode && !dirty)) return;
    dirty = false;
    const t = reduceMotion ? 0 : (now - t0) / 1000;
    if (scrollMode) {
      const r = stage.getBoundingClientRect();
      const p = reduceMotion ? 0.5 : clamp((innerHeight - r.top) / (innerHeight + r.height));
      pivot.rotation.y = -1.2 + p * Math.PI * 1.5;
      pivot.rotation.x = 0.45 - p * 0.35;
    } else {
      pivot.rotation.y = t * 0.5;
      pivot.rotation.x = 0.35;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  stage.classList.add("ready");
});
