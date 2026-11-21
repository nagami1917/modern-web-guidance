import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { OBJExporter } from './vendor/OBJExporter.js';
import { createKnightAsset, ARMOR_PALETTES } from './knight-model.js';

// ======================= 1. MODERN WEB GUIDANCE POLYFILLS & FALLBACKS =======================

// Conditional Invoker Commands polyfill (feature-detect on HTMLButtonElement.prototype)
if (!('commandForElement' in HTMLButtonElement.prototype)) {
  import('./vendor/invoker.min.js');
}

// Conditional Popover API polyfill (feature-detect on HTMLElement.prototype)
if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
  import('./vendor/popover.min.js');
}

// Probe discrete display transition support (guards against Firefox bug 1882408)
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(element, isPopover = false) {
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  if (isPopover) {
    element.hidePopover?.();
  } else {
    element.close?.();
  }
}

const exportDialog = document.getElementById('ExportAssetDialog');
const rigPopover = document.getElementById('RigHierarchyPopover');

// Route native dialog cancel (Esc / closedby) through closeTopLayer so exit animates cleanly
exportDialog?.addEventListener('cancel', (event) => {
  if (!supportsTopLayerExit()) {
    event.preventDefault();
    closeTopLayer(exportDialog, false);
  }
});

// Fallback for browsers without <dialog closedby="any">
if (exportDialog && !('closedBy' in HTMLDialogElement.prototype)) {
  exportDialog.addEventListener('click', (event) => {
    if (event.target !== exportDialog) return;
    const rect = exportDialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (isDialogContent) return;
    closeTopLayer(exportDialog, false);
  });
}

// Return focus to trigger when hiding popover from inside itself
document.querySelectorAll('[data-return-focus]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-return-focus');
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.focus();
    });
  });
});

// Range slider progress fill fallback when accent-color is unsupported
if (!CSS.supports('accent-color', '#000')) {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const syncProgress = () => {
      const min = Number(slider.min) || 0;
      const max = Number(slider.max) || 100;
      const val = Number(slider.value) || 0;
      const pct = ((val - min) / (max - min)) * 100;
      slider.style.setProperty('--progress', `${pct}%`);
    };
    syncProgress();
    slider.addEventListener('input', syncProgress);
  });
}

// ======================= 2. THREE.JS 3D STUDIO SCENE =======================

const canvas = document.getElementById('knight-canvas');
const stageEl = document.getElementById('canvas-container');
const viewportPanel = document.querySelector('.viewport-panel');
const announcer = document.getElementById('studio-announcer');
const badgeEl = document.getElementById('active-state-badge');

function announce(msg) {
  if (!announcer) return;
  announcer.textContent = msg;
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();

// Studio lighting & procedural environment reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.background = new THREE.Color('#1a2234');

const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(20, 16, 12),
  new THREE.MeshBasicMaterial({ color: '#3b4e76', side: THREE.BackSide })
);
envScene.add(skyDome);

const warmCard = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 8),
  new THREE.MeshBasicMaterial({ color: '#fff3d6', side: THREE.DoubleSide })
);
warmCard.position.set(6, 7, 6);
warmCard.lookAt(0, 1, 0);
envScene.add(warmCard);

const coolCard = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 8),
  new THREE.MeshBasicMaterial({ color: '#7db4ff', side: THREE.DoubleSide })
);
coolCard.position.set(-7, 5, -5);
coolCard.lookAt(0, 1, 0);
envScene.add(coolCard);

scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;
pmremGenerator.dispose();

// Match subtle 3D scene backdrop to system color-scheme (and handle runtime changes)
const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
function syncSceneBackdrop() {
  scene.background = new THREE.Color(darkSchemeQuery.matches ? '#111622' : '#1b2436');
}
syncSceneBackdrop();
darkSchemeQuery.addEventListener('change', syncSceneBackdrop);

// Camera & OrbitControls
const camera = new THREE.PerspectiveCamera(36, 16 / 11, 0.1, 50);
camera.position.set(1.45, 1.48, 2.75);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 1.02, 0);
controls.minDistance = 0.85;
controls.maxDistance = 6.5;
controls.maxPolarAngle = Math.PI * 0.52;
controls.update();

// Studio 3-Point Lighting
const hemiLight = new THREE.HemisphereLight('#dbeafe', '#1e293b', 0.85);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight('#fff5e0', 2.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 12;
keyLight.shadow.camera.left = -2.2;
keyLight.shadow.camera.right = 2.2;
keyLight.shadow.camera.top = 2.6;
keyLight.shadow.camera.bottom = -0.5;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight('#60a5fa', 1.45);
rimLight.position.set(-2.5, 2.4, -2.6);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight('#fde68a', 0.65);
fillLight.position.set(-1.8, 1.1, 2.2);
scene.add(fillLight);

function updateKeyLightAngle(deg) {
  const rad = (Number(deg) * Math.PI) / 180;
  const dist = 3.6;
  keyLight.position.set(Math.sin(rad) * dist, 3.3, Math.cos(rad) * dist);
}
updateKeyLightAngle(42);

// Subtle Shadow-Receiving Studio Floor Ring
const shadowFloor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 48),
  new THREE.ShadowMaterial({ opacity: 0.34 })
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = -0.08;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

// Build the Classic Medieval Fantasy Knight Asset
const knight = createKnightAsset('royal');
scene.add(knight.root);

// Populate live geometry stats into the Rig Inspector Popover
document.getElementById('stat-meshes').textContent = knight.stats.meshes.toLocaleString();
document.getElementById('stat-triangles').textContent = knight.stats.triangles.toLocaleString();
document.getElementById('stat-vertices').textContent = knight.stats.vertices.toLocaleString();

// ======================= 3. INTERACTIVE CONTROLS & STATE =======================

const POSE_LABELS = {
  idle: 'Heroic Idle',
  guard: 'Shield Guard',
  strike: 'Sword Cleave',
  salute: 'Royal Salute',
  march: 'Vanguard March',
  tpose: 'Rig T-Pose',
};

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let isMotionPaused = reducedMotionQuery.matches;
let currentPose = 'idle';
let currentPalette = 'royal';
let turntableEnabled = false;

const toggleMotionBtn = document.getElementById('toggle-motion-btn');
function syncMotionButtonLabel() {
  if (!toggleMotionBtn) return;
  toggleMotionBtn.textContent = isMotionPaused ? 'Play Motion' : 'Pause Motion';
}
syncMotionButtonLabel();

reducedMotionQuery.addEventListener('change', (e) => {
  isMotionPaused = e.matches;
  syncMotionButtonLabel();
});

toggleMotionBtn?.addEventListener('click', () => {
  isMotionPaused = !isMotionPaused;
  syncMotionButtonLabel();
  announce(isMotionPaused ? '3D animation paused' : '3D animation resumed');
});

function updateBadge() {
  const poseName = POSE_LABELS[currentPose] || currentPose;
  const palName = ARMOR_PALETTES[currentPalette]?.label || currentPalette;
  if (badgeEl) {
    badgeEl.textContent = `Stance: ${poseName} · ${palName}`;
  }
}

// Camera View Presets
const CAMERA_PRESETS = {
  hero: { pos: [1.45, 1.48, 2.75], target: [0, 1.02, 0] },
  front: { pos: [0, 1.22, 2.95], target: [0, 1.02, 0] },
  helm: { pos: [0.38, 1.72, 1.08], target: [0, 1.62, 0.04] },
  weapons: { pos: [1.65, 1.15, 1.85], target: [0, 0.95, 0.15] },
  back: { pos: [-1.15, 1.42, -2.75], target: [0, 1.02, 0] },
};

let cameraTransition = null;

document.querySelectorAll('[data-cam]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-cam');
    const preset = CAMERA_PRESETS[key];
    if (!preset) return;

    document.querySelectorAll('[data-cam]').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    const targetPos = new THREE.Vector3(...preset.pos);
    const targetLook = new THREE.Vector3(...preset.target);

    if (reducedMotionQuery.matches) {
      camera.position.copy(targetPos);
      controls.target.copy(targetLook);
      controls.update();
    } else {
      cameraTransition = {
        fromPos: camera.position.clone(),
        toPos: targetPos,
        fromTarget: controls.target.clone(),
        toTarget: targetLook,
        progress: 0,
      };
    }
  });
});

// Form Customizer Handlers
const form = document.getElementById('customizer-form');
form?.addEventListener('change', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.name === 'pose') {
    currentPose = target.value;
    updateBadge();
    announce(`Selected stance ${POSE_LABELS[currentPose]}`);
  } else if (target.name === 'palette') {
    currentPalette = target.value;
    knight.applyPalette(currentPalette);
    // Keep custom polish slider synced with newly chosen armor material
    const polishSlider = document.getElementById('polish-slider');
    if (polishSlider instanceof HTMLInputElement) {
      const smoothness = Math.round((1 - knight.materials.plate.roughness) * 100);
      polishSlider.value = String(smoothness);
      document.getElementById('polish-output').textContent = `${smoothness}%`;
    }
    updateBadge();
    announce(`Applied ${ARMOR_PALETTES[currentPalette]?.label} armor finish`);
  } else if (target.id === 'toggle-visor') {
    knight.setVisorOpen(target.checked);
    announce(target.checked ? 'Visor raised' : 'Visor lowered');
  } else if (target.id === 'toggle-cape') {
    knight.equipment.cape.visible = target.checked;
  } else if (target.id === 'toggle-shield') {
    knight.equipment.shield.visible = target.checked;
  } else if (target.id === 'toggle-sword') {
    knight.equipment.sword.visible = target.checked;
  } else if (target.id === 'toggle-plume') {
    knight.equipment.plume.visible = target.checked;
  } else if (target.id === 'toggle-pedestal') {
    knight.equipment.pedestal.visible = target.checked;
  } else if (target.id === 'toggle-wireframe') {
    Object.values(knight.materials).forEach((mat) => {
      mat.wireframe = target.checked;
    });
  } else if (target.id === 'toggle-turntable') {
    turntableEnabled = target.checked;
  }
});

const polishSlider = document.getElementById('polish-slider');
const polishOutput = document.getElementById('polish-output');
polishSlider?.addEventListener('input', () => {
  const val = Number(polishSlider.value);
  if (polishOutput) polishOutput.textContent = `${val}%`;
  const roughness = Math.max(0.04, (100 - val) / 100);
  knight.materials.plate.roughness = roughness;
  knight.materials.trim.roughness = Math.max(0.04, roughness * 0.85);
});

const lightSlider = document.getElementById('light-angle-slider');
const lightOutput = document.getElementById('light-angle-output');
lightSlider?.addEventListener('input', () => {
  const deg = Number(lightSlider.value);
  if (lightOutput) lightOutput.textContent = `${deg}°`;
  updateKeyLightAngle(deg);
});

// ======================= 4. LIVE ASSET EXPORTERS (.GLB / .OBJ / .PNG) =======================

const exportStatus = document.getElementById('export-status');

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

document.getElementById('export-live-glb-btn')?.addEventListener('click', () => {
  if (exportStatus) exportStatus.textContent = 'Generating binary glTF (.glb)…';
  knight.root.updateMatrixWorld(true);
  const exporter = new GLTFExporter();
  exporter.parse(
    knight.root,
    (buffer) => {
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      const filename = `valorian-knight-${currentPalette}-${currentPose}.glb`;
      triggerDownload(blob, filename);
      if (exportStatus) {
        exportStatus.textContent = `Exported ${filename} (${(blob.size / 1024).toFixed(0)} KB)`;
      }
    },
    (err) => {
      console.error(err);
      if (exportStatus) exportStatus.textContent = 'Export failed. Check console.';
    },
    { binary: true, onlyVisible: true }
  );
});

document.getElementById('export-live-obj-btn')?.addEventListener('click', () => {
  if (exportStatus) exportStatus.textContent = 'Generating Wavefront .obj…';
  knight.root.updateMatrixWorld(true);
  const exporter = new OBJExporter();
  const objText = exporter.parse(knight.root);
  const blob = new Blob([objText], { type: 'text/plain;charset=utf-8' });
  const filename = `valorian-knight-${currentPalette}-${currentPose}.obj`;
  triggerDownload(blob, filename);
  if (exportStatus) {
    exportStatus.textContent = `Exported ${filename} (${(blob.size / 1024).toFixed(0)} KB)`;
  }
});

function capturePngRender(fromDialog = false) {
  renderer.render(scene, camera);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const filename = `valorian-knight-${currentPalette}-${currentPose}.png`;
    triggerDownload(blob, filename);
    if (fromDialog && exportStatus) {
      exportStatus.textContent = `Saved ${filename}`;
    } else {
      announce(`Saved viewport render ${filename}`);
    }
  }, 'image/png');
}

document.getElementById('screenshot-btn')?.addEventListener('click', () => capturePngRender(false));
document.getElementById('export-live-png-btn')?.addEventListener('click', () => capturePngRender(true));

// ======================= 5. RESIZE & EFFICIENT BACKGROUND RENDER LOOP =======================

function resizeRenderer() {
  if (!stageEl) return;
  const width = stageEl.clientWidth || 800;
  const height = stageEl.clientHeight || 550;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

const resizeObserver = new ResizeObserver(() => resizeRenderer());
if (stageEl) resizeObserver.observe(stageEl);
resizeRenderer();

let rafId = 0;
let isViewportSkipped = false;
let elapsedAnimTime = 0;
let lastFrameTime = performance.now();

function renderLoop(now) {
  if (isViewportSkipped) {
    rafId = 0;
    return;
  }

  const delta = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (!isMotionPaused) {
    elapsedAnimTime += delta;
  }

  const motionScale = isMotionPaused ? 0 : 1;
  knight.updateAnimation(currentPose, elapsedAnimTime, delta, motionScale);

  if (turntableEnabled && !isMotionPaused) {
    knight.root.rotation.y += delta * 0.55;
  }

  if (cameraTransition) {
    cameraTransition.progress = Math.min(1, cameraTransition.progress + delta * 2.6);
    const t = cameraTransition.progress;
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(cameraTransition.fromPos, cameraTransition.toPos, ease);
    controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, ease);
    if (t >= 1) cameraTransition = null;
  }

  controls.update();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(renderLoop);
}

function startSimulation() {
  isViewportSkipped = false;
  if (!rafId) {
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(renderLoop);
  }
}

function stopSimulation() {
  isViewportSkipped = true;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

// Efficient Background Processing per modern-web-guidance:
// Direct listener on the element with content-visibility: auto (since event may not bubble),
// plus IntersectionObserver fallback for older browsers without content-visibility support.
if (viewportPanel) {
  if ('contentVisibility' in document.documentElement.style) {
    viewportPanel.addEventListener('contentvisibilityautostatechange', (event) => {
      if (event.skipped) {
        stopSimulation();
      } else {
        startSimulation();
      }
    });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startSimulation();
          } else {
            stopSimulation();
          }
        });
      },
      { rootMargin: '200px' }
    );
    io.observe(viewportPanel);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopSimulation();
  } else if (!isViewportSkipped) {
    startSimulation();
  }
});

startSimulation();
