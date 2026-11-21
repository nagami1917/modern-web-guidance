import * as THREE from './vendor/three.module.min.js';

export const ARMOR_PALETTES = {
  royal: {
    id: 'royal',
    label: 'Royal Valorian',
    plateColor: '#c8d0db',
    plateMetalness: 0.88,
    plateRoughness: 0.22,
    trimColor: '#d9a441',
    trimMetalness: 0.92,
    trimRoughness: 0.2,
    clothColor: '#1e429f',
    clothRoughness: 0.78,
    plumeColor: '#2563eb',
    leatherColor: '#4a2f1d',
    shieldField: '#17347a',
    shieldBorder: '#e0ad48',
    bladeColor: '#dce3ec',
    eyeGlow: '#60a5fa',
  },
  crimson: {
    id: 'crimson',
    label: 'Crimson Templar',
    plateColor: '#d5d9df',
    plateMetalness: 0.9,
    plateRoughness: 0.2,
    trimColor: '#c89b3c',
    trimMetalness: 0.9,
    trimRoughness: 0.22,
    clothColor: '#8b1a24',
    clothRoughness: 0.8,
    plumeColor: '#b91c1c',
    leatherColor: '#3b2316',
    shieldField: '#7f1d1d',
    shieldBorder: '#d4af37',
    bladeColor: '#e5ebf2',
    eyeGlow: '#fb923c',
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Dragoon',
    plateColor: '#2c313a',
    plateMetalness: 0.86,
    plateRoughness: 0.26,
    trimColor: '#c98a2c',
    trimMetalness: 0.92,
    trimRoughness: 0.18,
    clothColor: '#4c1d95',
    clothRoughness: 0.76,
    plumeColor: '#7c3aed',
    leatherColor: '#1f1916',
    shieldField: '#1e1b2e',
    shieldBorder: '#d99b38',
    bladeColor: '#b8c4d4',
    eyeGlow: '#a78bfa',
  },
  gilded: {
    id: 'gilded',
    label: 'Sunforge Paladin',
    plateColor: '#e8dcc4',
    plateMetalness: 0.85,
    plateRoughness: 0.2,
    trimColor: '#f0b429',
    trimMetalness: 0.95,
    trimRoughness: 0.16,
    clothColor: '#0f5c4d',
    clothRoughness: 0.75,
    plumeColor: '#f59e0b',
    leatherColor: '#52341e',
    shieldField: '#0d4a3e',
    shieldBorder: '#f4c145',
    bladeColor: '#eef3f8',
    eyeGlow: '#fde047',
  },
};

function makeLathePoints(pairs) {
  return pairs.map(([r, y]) => new THREE.Vector2(r, y));
}

function createKiteShieldGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.44);
  shape.quadraticCurveTo(0.26, 0.43, 0.31, 0.34);
  shape.quadraticCurveTo(0.32, 0.02, 0.20, -0.24);
  shape.quadraticCurveTo(0.10, -0.43, 0, -0.52);
  shape.quadraticCurveTo(-0.10, -0.43, -0.20, -0.24);
  shape.quadraticCurveTo(-0.32, 0.02, -0.31, 0.34);
  shape.quadraticCurveTo(-0.26, 0.43, 0, 0.44);

  const extrudeSettings = {
    steps: 1,
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelOffset: 0,
    bevelSegments: 3,
  };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();

  // Subtle curved shield bow along X -> Z
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const curve = -0.16 * (x * x) / 0.1;
    pos.setZ(i, z + curve * 0.08);
  }
  geom.computeVertexNormals();
  geom.normalizeNormals();
  return geom;
}

function createStarEmblemGeometry(outerR = 0.14, innerR = 0.052, points = 8, depth = 0.016) {
  const shape = new THREE.Shape();
  const total = points * 2;
  for (let i = 0; i <= total; i++) {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  geom.center();
  geom.computeVertexNormals();
  geom.normalizeNormals();
  return geom;
}

function createSwordBladeGeometry() {
  // Diamond-profile tapered longsword blade from y=0 to y=0.92
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.016);
  shape.lineTo(0.044, 0);
  shape.lineTo(0, -0.016);
  shape.lineTo(-0.044, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 14,
    depth: 0.92,
    bevelEnabled: false,
  });
  // Rotate so extrusion goes along +Y
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = Math.max(0, Math.min(1, y / 0.92));
    // Gentle taper along blade, sharp point in final 18%
    let widthScale;
    let thickScale;
    if (t < 0.82) {
      widthScale = 1.0 - t * 0.28;
      thickScale = 1.0 - t * 0.25;
    } else {
      const tipT = (t - 0.82) / 0.18;
      widthScale = (1.0 - 0.82 * 0.28) * (1.0 - Math.pow(tipT, 1.35));
      thickScale = (1.0 - 0.82 * 0.25) * (1.0 - Math.pow(tipT, 1.2));
    }
    pos.setX(i, x * Math.max(0.002, widthScale));
    pos.setZ(i, z * Math.max(0.002, thickScale));
  }
  geom.computeVertexNormals();
  geom.normalizeNormals();
  return geom;
}

function createCapeGeometry() {
  const geom = new THREE.PlaneGeometry(0.56, 0.98, 12, 16);
  // Shift top edge to y=0 so it hangs from shoulders down to y=-0.98
  geom.translate(0, -0.49, 0);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i); // 0 at top, -0.98 at bottom
    const t = Math.abs(y) / 0.98;
    // Flare wider toward bottom hem
    const flare = 0.72 + t * 0.58;
    const nx = x * flare;
    // Drape backward and add gentle pleat folds
    const fold = Math.sin((x / 0.28) * Math.PI * 3) * 0.022 * t;
    const arch = -Math.pow(x / 0.35, 2) * 0.05 * (1 - t * 0.4);
    const drapeZ = -0.02 - Math.pow(t, 1.35) * 0.12 + fold + arch;
    pos.setX(i, nx);
    pos.setZ(i, drapeZ);
  }
  geom.computeVertexNormals();
  geom.normalizeNormals();
  return geom;
}

/**
 * Builds the Classic Medieval Fantasy Knight 3D Asset.
 * Returns { root, joints, materials, equipment, stats, applyPalette, updateAnimation, setPose }.
 */
export function createKnightAsset(initialPaletteKey = 'royal') {
  const palette = ARMOR_PALETTES[initialPaletteKey] || ARMOR_PALETTES.royal;

  const materials = {
    plate: new THREE.MeshStandardMaterial({
      name: 'KnightPlateSteel',
      color: new THREE.Color(palette.plateColor),
      metalness: palette.plateMetalness,
      roughness: palette.plateRoughness,
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      name: 'ChainmailAndJoints',
      color: new THREE.Color('#3b4250'),
      metalness: 0.78,
      roughness: 0.46,
    }),
    trim: new THREE.MeshStandardMaterial({
      name: 'GildedBrassTrim',
      color: new THREE.Color(palette.trimColor),
      metalness: palette.trimMetalness,
      roughness: palette.trimRoughness,
    }),
    cloth: new THREE.MeshStandardMaterial({
      name: 'HeraldicSurcoat',
      color: new THREE.Color(palette.clothColor),
      metalness: 0.06,
      roughness: palette.clothRoughness,
      side: THREE.DoubleSide,
    }),
    plume: new THREE.MeshStandardMaterial({
      name: 'CrestPlume',
      color: new THREE.Color(palette.plumeColor),
      metalness: 0.08,
      roughness: 0.65,
    }),
    leather: new THREE.MeshStandardMaterial({
      name: 'BeltLeather',
      color: new THREE.Color(palette.leatherColor),
      metalness: 0.12,
      roughness: 0.72,
    }),
    shieldField: new THREE.MeshStandardMaterial({
      name: 'ShieldEnamel',
      color: new THREE.Color(palette.shieldField),
      metalness: 0.35,
      roughness: 0.38,
    }),
    blade: new THREE.MeshStandardMaterial({
      name: 'ForgedSwordBlade',
      color: new THREE.Color(palette.bladeColor),
      metalness: 0.95,
      roughness: 0.14,
    }),
    visorSlit: new THREE.MeshStandardMaterial({
      name: 'VisorShadow',
      color: new THREE.Color('#090d16'),
      emissive: new THREE.Color(palette.eyeGlow),
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.4,
    }),
    pedestalStone: new THREE.MeshStandardMaterial({
      name: 'RunicStoneBase',
      color: new THREE.Color('#39404d'),
      metalness: 0.15,
      roughness: 0.82,
    }),
  };

  const root = new THREE.Group();
  root.name = 'ValorianKnightAsset';

  // ==================== PEDESTAL ====================
  const pedestalGroup = new THREE.Group();
  pedestalGroup.name = 'StonePedestal';

  const plinthLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.84, 0.08, 32),
    materials.pedestalStone
  );
  plinthLower.position.y = -0.04;
  plinthLower.name = 'PedestalLower';
  pedestalGroup.add(plinthLower);

  const plinthUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.74, 0.05, 32),
    materials.pedestalStone
  );
  plinthUpper.position.y = -0.015;
  plinthUpper.name = 'PedestalUpper';
  pedestalGroup.add(plinthUpper);

  const plinthRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.70, 0.016, 12, 48),
    materials.trim
  );
  plinthRing.rotation.x = Math.PI / 2;
  plinthRing.position.y = 0.005;
  plinthRing.name = 'PedestalBrassInlay';
  pedestalGroup.add(plinthRing);

  root.add(pedestalGroup);

  // ==================== RIG HIERARCHY ====================
  const characterRoot = new THREE.Group();
  characterRoot.name = 'KnightRig';
  root.add(characterRoot);

  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.94, 0);
  characterRoot.add(hips);

  // Pelvis / Faulds / Tassets / Belt
  const pelvis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.155, 0.16, 16),
    materials.darkSteel
  );
  pelvis.name = 'MailleChaussesTop';
  hips.add(pelvis);

  // Layered Fauld Rings
  for (let i = 0; i < 3; i++) {
    const fauld = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195 + i * 0.012, 0.21 + i * 0.014, 0.05, 20),
      materials.plate
    );
    fauld.position.y = 0.05 - i * 0.042;
    fauld.scale.set(1.06, 1, 0.86);
    fauld.name = `FauldPlate_${i + 1}`;
    hips.add(fauld);
  }

  // Front & Back Surcoat Tabard Skirts
  const frontTabard = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.34, 0.022),
    materials.cloth
  );
  frontTabard.position.set(0, -0.14, 0.185);
  frontTabard.rotation.x = -0.06;
  frontTabard.name = 'SurcoatFrontSkirt';
  hips.add(frontTabard);

  const frontTabardTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.215, 0.026, 0.026),
    materials.trim
  );
  frontTabardTrim.position.set(0, -0.30, 0.196);
  frontTabardTrim.name = 'SurcoatFrontHemTrim';
  hips.add(frontTabardTrim);

  const backTabard = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.34, 0.022),
    materials.cloth
  );
  backTabard.position.set(0, -0.14, -0.18);
  backTabard.rotation.x = 0.06;
  backTabard.name = 'SurcoatBackSkirt';
  hips.add(backTabard);

  // Side Tassets (hip armor plates)
  for (const side of [-1, 1]) {
    const tasset = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.22, 0.20),
      materials.plate
    );
    tasset.position.set(side * 0.22, -0.09, 0.01);
    tasset.rotation.z = side * 0.18;
    tasset.name = side < 0 ? 'LeftTasset' : 'RightTasset';
    hips.add(tasset);

    const tassetTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.024, 0.206),
      materials.trim
    );
    tassetTrim.position.set(side * 0.238, -0.19, 0.01);
    tassetTrim.rotation.z = side * 0.18;
    tassetTrim.name = side < 0 ? 'LeftTassetTrim' : 'RightTassetTrim';
    hips.add(tassetTrim);
  }

  // Knightly Sword Belt & Buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.206, 0.208, 0.055, 24),
    materials.leather
  );
  belt.position.y = 0.075;
  belt.scale.set(1.06, 1, 0.88);
  belt.name = 'KnightBelt';
  hips.add(belt);

  const beltBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.075, 0.032),
    materials.trim
  );
  beltBuckle.position.set(0, 0.075, 0.186);
  beltBuckle.name = 'BeltBuckle';
  hips.add(beltBuckle);

  // Scabbard at Left Hip
  const scabbardGroup = new THREE.Group();
  scabbardGroup.name = 'HipScabbard';
  scabbardGroup.position.set(-0.24, 0.03, -0.02);
  scabbardGroup.rotation.set(0.42, 0.08, 0.14);
  const scabbardBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.72, 0.068),
    materials.leather
  );
  scabbardBody.position.y = -0.32;
  scabbardGroup.add(scabbardBody);
  const scabbardLocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.06, 0.076),
    materials.trim
  );
  scabbardLocket.position.y = 0.02;
  scabbardGroup.add(scabbardLocket);
  const scabbardChape = new THREE.Mesh(
    new THREE.ConeGeometry(0.036, 0.1, 8),
    materials.trim
  );
  scabbardChape.rotation.z = Math.PI;
  scabbardChape.position.y = -0.71;
  scabbardGroup.add(scabbardChape);
  hips.add(scabbardGroup);

  // ==================== TORSO / CUIRASS ====================
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.11, 0);
  hips.add(spine);

  // Lathe sculpted Gothic Cuirass
  const cuirassGeom = new THREE.LatheGeometry(
    makeLathePoints([
      [0.01, 0.0],
      [0.185, 0.02],
      [0.175, 0.10],
      [0.215, 0.22],
      [0.245, 0.34],
      [0.225, 0.43],
      [0.145, 0.47],
      [0.11, 0.48],
    ]),
    24
  );
  const cuirass = new THREE.Mesh(cuirassGeom, materials.plate);
  cuirass.scale.set(1.08, 1.0, 0.82);
  cuirass.name = 'BreastplateCuirass';
  spine.add(cuirass);

  // Plackart ridge (Gothic V-shaped chest plate overlay)
  const chestKeel = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.30, 4),
    materials.plate
  );
  chestKeel.position.set(0, 0.25, 0.13);
  chestKeel.rotation.set(0.14, Math.PI / 4, Math.PI);
  chestKeel.scale.set(1.25, 1, 0.55);
  chestKeel.name = 'GothicPlackartRidge';
  spine.add(chestKeel);

  // Heraldic Chest Crest (Golden 8-point Star)
  const chestStar = new THREE.Mesh(
    createStarEmblemGeometry(0.075, 0.028, 8, 0.012),
    materials.trim
  );
  chestStar.position.set(0, 0.30, 0.206);
  chestStar.rotation.x = -0.08;
  chestStar.name = 'CuirassStarEmblem';
  spine.add(chestStar);

  // Gorget (armored neck collar + brass rim)
  const gorget = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.175, 0.09, 20),
    materials.plate
  );
  gorget.position.set(0, 0.47, 0);
  gorget.scale.set(1.05, 1, 0.92);
  gorget.name = 'ArmoredGorget';
  spine.add(gorget);

  const gorgetTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.142, 0.012, 10, 28),
    materials.trim
  );
  gorgetTrim.rotation.x = Math.PI / 2;
  gorgetTrim.position.set(0, 0.505, 0);
  gorgetTrim.scale.set(1.05, 0.92, 1);
  gorgetTrim.name = 'GorgetTrim';
  spine.add(gorgetTrim);

  // ==================== CAPE ====================
  const capePivot = new THREE.Group();
  capePivot.name = 'CapeRig';
  capePivot.position.set(0, 0.45, -0.15);
  spine.add(capePivot);

  const capeMesh = new THREE.Mesh(createCapeGeometry(), materials.cloth);
  capeMesh.name = 'RoyalMantleCape';
  capePivot.add(capeMesh);

  // Cloak Shoulder Clasps (Medallions)
  for (const side of [-1, 1]) {
    const clasp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.046, 0.02, 16),
      materials.trim
    );
    clasp.rotation.x = Math.PI / 2 - 0.35;
    clasp.position.set(side * 0.17, 0.44, 0.14);
    clasp.name = side < 0 ? 'LeftCloakClasp' : 'RightCloakClasp';
    spine.add(clasp);
  }

  // ==================== HEAD / HELMET ====================
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.52, 0);
  spine.add(neck);

  const mailCoif = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.115, 0.09, 16),
    materials.darkSteel
  );
  mailCoif.position.y = 0.02;
  mailCoif.name = 'ChainmailCoif';
  neck.add(mailCoif);

  const head = new THREE.Group();
  head.name = 'HelmetHead';
  head.position.set(0, 0.05, 0);
  neck.add(head);

  // Armet / Sallet-inspired Knight Helm Bowl
  const helmBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.148, 24, 20),
    materials.plate
  );
  helmBowl.position.set(0, 0.13, -0.01);
  helmBowl.scale.set(0.95, 1.08, 1.06);
  helmBowl.name = 'HelmetSkullBowl';
  head.add(helmBowl);

  // Helm Lower Cheek / Chin Bevor
  const helmBevor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.132, 0.112, 0.14, 18),
    materials.plate
  );
  helmBevor.position.set(0, 0.06, 0.015);
  helmBevor.scale.set(0.94, 1, 1.08);
  helmBevor.name = 'HelmetBevor';
  head.add(helmBevor);

  // Central Brass Comb Ridge along top of helmet
  const helmComb = new THREE.Mesh(
    new THREE.TorusGeometry(0.146, 0.016, 10, 24, Math.PI * 1.05),
    materials.trim
  );
  helmComb.rotation.y = Math.PI / 2;
  helmComb.rotation.x = -0.15;
  helmComb.position.set(0, 0.14, -0.01);
  helmComb.name = 'HelmetCombCrest';
  head.add(helmComb);

  // Articulated Visor Pivot (can be raised/lowered!)
  const visorPivot = new THREE.Group();
  visorPivot.name = 'VisorPivot';
  visorPivot.position.set(0, 0.125, 0.02);
  head.add(visorPivot);

  // Pointed Houndskull / Close-Helm Prow Visor
  const visorUpper = new THREE.Mesh(
    new THREE.ConeGeometry(0.136, 0.17, 6),
    materials.plate
  );
  visorUpper.rotation.x = Math.PI / 2 + 0.08;
  visorUpper.rotation.y = Math.PI / 6;
  visorUpper.position.set(0, -0.012, 0.098);
  visorUpper.scale.set(1.0, 1.0, 0.82);
  visorUpper.name = 'PointedFaceVisor';
  visorPivot.add(visorUpper);

  // Visor Brass Brow Trim
  const visorTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.018, 0.08),
    materials.trim
  );
  visorTrim.position.set(0, 0.032, 0.105);
  visorTrim.rotation.x = 0.15;
  visorTrim.name = 'VisorBrowTrim';
  visorPivot.add(visorTrim);

  // Glowing Eye Slit inside Visor
  for (const side of [-1, 1]) {
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.013, 0.03),
      materials.visorSlit
    );
    slit.position.set(side * 0.044, 0.014, 0.142);
    slit.rotation.y = side * 0.28;
    slit.rotation.z = side * -0.06;
    slit.name = side < 0 ? 'LeftEyeSlit' : 'RightEyeSlit';
    visorPivot.add(slit);

    // Rivet rosettes at visor hinges
    const hingeRivet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
      materials.trim
    );
    hingeRivet.rotation.z = Math.PI / 2;
    hingeRivet.position.set(side * 0.138, 0, 0);
    hingeRivet.name = side < 0 ? 'LeftVisorHinge' : 'RightVisorHinge';
    visorPivot.add(hingeRivet);
  }

  // Flowing Horsehair Plume atop Helmet
  const plumeGroup = new THREE.Group();
  plumeGroup.name = 'HelmetPlumeGroup';
  plumeGroup.position.set(0, 0.27, -0.03);
  head.add(plumeGroup);

  const plumeHolder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.03, 0.06, 12),
    materials.trim
  );
  plumeHolder.rotation.x = -0.35;
  plumeGroup.add(plumeHolder);

  const plumeArcSegments = 7;
  for (let i = 0; i < plumeArcSegments; i++) {
    const t = i / (plumeArcSegments - 1);
    const radius = 0.046 + Math.sin(t * Math.PI) * 0.034 - t * 0.015;
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 14, 12),
      materials.plume
    );
    const angle = t * 1.95;
    seg.position.set(
      0,
      0.045 + Math.sin(angle) * 0.09 - t * 0.08,
      0.02 - (1 - Math.cos(angle)) * 0.14 - t * 0.08
    );
    seg.scale.set(0.55, 1.05, 1.35);
    seg.rotation.x = -t * 1.1;
    seg.name = `PlumeTuft_${i + 1}`;
    plumeGroup.add(seg);
  }

  // ==================== ARMS, SHIELD & LONGSWORD ====================
  function buildArm(side) {
    const isRight = side > 0;
    const prefix = isRight ? 'Right' : 'Left';

    const shoulder = new THREE.Group();
    shoulder.name = `${prefix}Shoulder`;
    shoulder.position.set(side * 0.285, 0.41, 0);
    spine.add(shoulder);

    // Layered Pauldron (Shoulder Armor)
    const pauldronMain = new THREE.Mesh(
      new THREE.SphereGeometry(0.118, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      materials.plate
    );
    pauldronMain.position.set(side * 0.02, 0.02, 0);
    pauldronMain.rotation.z = side * -0.48;
    pauldronMain.scale.set(1.12, 0.95, 1.08);
    pauldronMain.name = `${prefix}Pauldron`;
    shoulder.add(pauldronMain);

    const pauldronLame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.102, 0.112, 0.055, 16, 1, true),
      materials.plate
    );
    pauldronLame.position.set(side * 0.03, -0.055, 0);
    pauldronLame.rotation.z = side * -0.15;
    pauldronLame.name = `${prefix}PauldronLowerLame`;
    shoulder.add(pauldronLame);

    const pauldronTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.108, 0.01, 8, 24),
      materials.trim
    );
    pauldronTrim.rotation.x = Math.PI / 2;
    pauldronTrim.rotation.y = side * -0.35;
    pauldronTrim.position.set(side * 0.028, -0.025, 0);
    pauldronTrim.name = `${prefix}PauldronTrim`;
    shoulder.add(pauldronTrim);

    // Haute-piece (upright neck guard blade on pauldron)
    const hautePiece = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.085, 0.15),
      materials.trim
    );
    hautePiece.position.set(side * -0.035, 0.085, 0);
    hautePiece.rotation.z = side * 0.2;
    hautePiece.name = `${prefix}HautePiece`;
    shoulder.add(hautePiece);

    // Upper Arm (Rerebrace)
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.058, 0.25, 14),
      materials.plate
    );
    upperArm.position.set(side * 0.02, -0.15, 0);
    upperArm.name = `${prefix}Rerebrace`;
    shoulder.add(upperArm);

    const elbowJoint = new THREE.Group();
    elbowJoint.name = `${prefix}Elbow`;
    elbowJoint.position.set(side * 0.02, -0.28, 0);
    shoulder.add(elbowJoint);

    // Couter (Elbow cop + side wing)
    const couter = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 12),
      materials.plate
    );
    couter.scale.set(1.05, 0.9, 1.1);
    couter.name = `${prefix}Couter`;
    elbowJoint.add(couter);

    const couterWing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.016, 12),
      materials.trim
    );
    couterWing.rotation.z = Math.PI / 2;
    couterWing.position.set(side * 0.065, 0, -0.01);
    couterWing.name = `${prefix}CouterRondel`;
    elbowJoint.add(couterWing);

    // Vambrace (Forearm armor)
    const vambrace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.048, 0.24, 14),
      materials.plate
    );
    vambrace.position.set(0, -0.13, 0);
    vambrace.name = `${prefix}Vambrace`;
    elbowJoint.add(vambrace);

    const vambraceCuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.066, 0.054, 0.05, 14),
      materials.trim
    );
    vambraceCuff.position.set(0, -0.23, 0);
    vambraceCuff.name = `${prefix}GauntletCuff`;
    elbowJoint.add(vambraceCuff);

    const wrist = new THREE.Group();
    wrist.name = `${prefix}Wrist`;
    wrist.position.set(0, -0.265, 0);
    elbowJoint.add(wrist);

    // Armored Gauntlet Fist
    const gauntlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.095, 0.092),
      materials.plate
    );
    gauntlet.position.set(0, -0.035, 0.01);
    gauntlet.name = `${prefix}Gauntlet`;
    wrist.add(gauntlet);

    const knuckleGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.088, 0.022, 0.098),
      materials.trim
    );
    knuckleGuard.position.set(0, -0.045, 0.012);
    knuckleGuard.name = `${prefix}KnucklePlate`;
    wrist.add(knuckleGuard);

    return { shoulder, elbow: elbowJoint, wrist };
  }

  const rightArm = buildArm(1);
  const leftArm = buildArm(-1);

  // ==================== LONGSWORD (Right Hand) ====================
  const swordGroup = new THREE.Group();
  swordGroup.name = 'ValorianLongsword';
  // Held pointing forward/up from right gauntlet
  swordGroup.position.set(0, -0.045, 0.03);
  swordGroup.rotation.x = Math.PI / 2 - 0.15;
  rightArm.wrist.add(swordGroup);

  // Pommel
  const pommel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.042, 1),
    materials.trim
  );
  pommel.position.y = -0.16;
  pommel.scale.set(1, 1.1, 0.75);
  pommel.name = 'SwordPommel';
  swordGroup.add(pommel);

  // Leather-wrapped Grip
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.023, 0.16, 12),
    materials.leather
  );
  grip.position.y = -0.07;
  grip.name = 'SwordGrip';
  swordGroup.add(grip);

  // Cruciform Crossguard with Flared Quillons
  const crossguard = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.028, 0.038),
    materials.trim
  );
  crossguard.position.y = 0.015;
  crossguard.name = 'SwordCrossguard';
  swordGroup.add(crossguard);

  for (const qSide of [-1, 1]) {
    const quillonTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 10),
      materials.trim
    );
    quillonTip.position.set(qSide * 0.145, 0.018, 0);
    quillonTip.scale.set(1.2, 0.9, 0.9);
    swordGroup.add(quillonTip);
  }

  const rainGuard = new THREE.Mesh(
    new THREE.ConeGeometry(0.038, 0.06, 4),
    materials.trim
  );
  rainGuard.position.y = 0.035;
  rainGuard.rotation.set(Math.PI, Math.PI / 4, 0);
  rainGuard.scale.set(1.2, 1, 0.55);
  swordGroup.add(rainGuard);

  // Steel Blade
  const blade = new THREE.Mesh(createSwordBladeGeometry(), materials.blade);
  blade.position.y = 0.028;
  blade.name = 'SwordBlade';
  swordGroup.add(blade);

  // ==================== KITE SHIELD (Left Forearm) ====================
  const shieldGroup = new THREE.Group();
  shieldGroup.name = 'HeraldicKiteShield';
  shieldGroup.position.set(-0.085, -0.12, 0.075);
  shieldGroup.rotation.set(0.08, -1.15, 0.12);
  leftArm.elbow.add(shieldGroup);

  const shieldBody = new THREE.Mesh(createKiteShieldGeometry(), materials.shieldField);
  shieldBody.name = 'KiteShieldCore';
  shieldGroup.add(shieldBody);

  // Shield Outer Rim Accent Plate (slightly scaled behind/around)
  const shieldRim = new THREE.Mesh(createKiteShieldGeometry(), materials.trim);
  shieldRim.scale.set(1.065, 1.05, 0.78);
  shieldRim.position.z = -0.004;
  shieldRim.name = 'KiteShieldBrassRim';
  shieldGroup.add(shieldRim);

  // Heraldic Star Boss in Center of Shield
  const shieldBoss = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    materials.trim
  );
  shieldBoss.rotation.x = Math.PI / 2;
  shieldBoss.position.set(0, 0.06, 0.026);
  shieldBoss.name = 'ShieldBoss';
  shieldGroup.add(shieldBoss);

  const shieldStar = new THREE.Mesh(
    createStarEmblemGeometry(0.145, 0.052, 8, 0.016),
    materials.trim
  );
  shieldStar.position.set(0, 0.06, 0.032);
  shieldStar.name = 'ShieldStarCrest';
  shieldGroup.add(shieldStar);

  // ==================== LEGS, POLEYNS, GREAVES & SABATONS ====================
  function buildLeg(side) {
    const isRight = side > 0;
    const prefix = isRight ? 'Right' : 'Left';

    const hipJoint = new THREE.Group();
    hipJoint.name = `${prefix}Hip`;
    hipJoint.position.set(side * 0.115, -0.06, 0);
    hips.add(hipJoint);

    // Cuisse (Thigh Plate)
    const cuisse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.072, 0.34, 16),
      materials.plate
    );
    cuisse.position.set(0, -0.19, 0);
    cuisse.name = `${prefix}Cuisse`;
    hipJoint.add(cuisse);

    const kneeJoint = new THREE.Group();
    kneeJoint.name = `${prefix}Knee`;
    kneeJoint.position.set(0, -0.38, 0);
    hipJoint.add(kneeJoint);

    // Poleyn (Articulated Knee Cop + Brass Fin)
    const poleyn = new THREE.Mesh(
      new THREE.SphereGeometry(0.078, 16, 12),
      materials.plate
    );
    poleyn.position.set(0, 0, 0.018);
    poleyn.scale.set(0.95, 0.95, 1.15);
    poleyn.name = `${prefix}Poleyn`;
    kneeJoint.add(poleyn);

    const poleynCrest = new THREE.Mesh(
      new THREE.ConeGeometry(0.052, 0.09, 4),
      materials.trim
    );
    poleynCrest.rotation.x = Math.PI / 2;
    poleynCrest.rotation.y = Math.PI / 4;
    poleynCrest.position.set(0, 0.005, 0.088);
    poleynCrest.scale.set(0.85, 1, 1.15);
    poleynCrest.name = `${prefix}PoleynSpike`;
    kneeJoint.add(poleynCrest);

    // Greave (Shin Armor)
    const greave = new THREE.Mesh(
      new THREE.LatheGeometry(
        makeLathePoints([
          [0.052, 0.0],
          [0.058, 0.08],
          [0.076, 0.24],
          [0.068, 0.34],
        ]),
        16
      ),
      materials.plate
    );
    greave.position.set(0, -0.36, 0);
    greave.name = `${prefix}Greave`;
    kneeJoint.add(greave);

    const ankleJoint = new THREE.Group();
    ankleJoint.name = `${prefix}Ankle`;
    ankleJoint.position.set(0, -0.375, 0);
    kneeJoint.add(ankleJoint);

    // Sabaton (Armored Foot)
    const sabatonHeel = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.085, 0.15),
      materials.plate
    );
    sabatonHeel.position.set(0, -0.04, 0.015);
    sabatonHeel.name = `${prefix}SabatonHeel`;
    ankleJoint.add(sabatonHeel);

    const sabatonToe = new THREE.Mesh(
      new THREE.ConeGeometry(0.064, 0.15, 6),
      materials.plate
    );
    sabatonToe.rotation.x = Math.PI / 2;
    sabatonToe.position.set(0, -0.052, 0.135);
    sabatonToe.scale.set(0.95, 1, 0.68);
    sabatonToe.name = `${prefix}SabatonPoulaine`;
    ankleJoint.add(sabatonToe);

    const sabatonSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.02, 0.25),
      materials.darkSteel
    );
    sabatonSole.position.set(0, -0.082, 0.05);
    sabatonSole.name = `${prefix}SabatonSole`;
    ankleJoint.add(sabatonSole);

    return { hip: hipJoint, knee: kneeJoint, ankle: ankleJoint };
  }

  const rightLeg = buildLeg(1);
  const leftLeg = buildLeg(-1);

  // Enable cast/receive shadows across all meshes & compute geometry stats
  let vertexCount = 0;
  let triangleCount = 0;
  let meshCount = 0;

  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      meshCount += 1;
      const geom = obj.geometry;
      if (geom?.attributes?.position) {
        vertexCount += geom.attributes.position.count;
        if (geom.index) {
          triangleCount += Math.floor(geom.index.count / 3);
        } else {
          triangleCount += Math.floor(geom.attributes.position.count / 3);
        }
      }
    }
  });

  const joints = {
    hips,
    spine,
    neck,
    head,
    visorPivot,
    capePivot,
    plumeGroup,
    rightArm,
    leftArm,
    rightLeg,
    leftLeg,
    swordGroup,
    shieldGroup,
    pedestalGroup,
  };

  const equipment = {
    cape: capePivot,
    shield: shieldGroup,
    sword: swordGroup,
    plume: plumeGroup,
    pedestal: pedestalGroup,
  };

  function applyPalette(paletteKey) {
    const p = ARMOR_PALETTES[paletteKey] || ARMOR_PALETTES.royal;
    materials.plate.color.set(p.plateColor);
    materials.plate.metalness = p.plateMetalness;
    materials.plate.roughness = p.plateRoughness;

    materials.trim.color.set(p.trimColor);
    materials.trim.metalness = p.trimMetalness;
    materials.trim.roughness = p.trimRoughness;

    materials.cloth.color.set(p.clothColor);
    materials.cloth.roughness = p.clothRoughness;

    materials.plume.color.set(p.plumeColor);
    materials.leather.color.set(p.leatherColor);
    materials.shieldField.color.set(p.shieldField);
    materials.blade.color.set(p.bladeColor);
    materials.visorSlit.emissive.set(p.eyeGlow);
  }

  let visorOpen = false;
  let targetVisorAngle = 0;
  let currentVisorAngle = 0;

  function setVisorOpen(open) {
    visorOpen = Boolean(open);
    targetVisorAngle = visorOpen ? -0.95 : 0;
  }

  function resetJoints() {
    hips.position.set(0, 0.94, 0);
    hips.rotation.set(0, 0, 0);
    spine.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    capePivot.rotation.set(0.06, 0, 0);

    rightArm.shoulder.rotation.set(0, 0, 0);
    rightArm.elbow.rotation.set(0, 0, 0);
    rightArm.wrist.rotation.set(0, 0, 0);

    leftArm.shoulder.rotation.set(0, 0, 0);
    leftArm.elbow.rotation.set(0, 0, 0);
    leftArm.wrist.rotation.set(0, 0, 0);

    rightLeg.hip.rotation.set(0, 0, 0);
    rightLeg.knee.rotation.set(0, 0, 0);
    rightLeg.ankle.rotation.set(0, 0, 0);

    leftLeg.hip.rotation.set(0, 0, 0);
    leftLeg.knee.rotation.set(0, 0, 0);
    leftLeg.ankle.rotation.set(0, 0, 0);
  }

  /**
   * Procedural skeletal animation controller for the knight rig.
   * Poses: 'idle' | 'guard' | 'strike' | 'salute' | 'march' | 'tpose'
   */
  function updateAnimation(pose = 'idle', elapsed = 0, delta = 0.016, motionScale = 1) {
    resetJoints();

    // Smoothly interpolate visor opening/closing
    currentVisorAngle += (targetVisorAngle - currentVisorAngle) * Math.min(1, delta * 9);
    visorPivot.rotation.x = currentVisorAngle;

    const t = elapsed * motionScale;

    if (pose === 'tpose') {
      rightArm.shoulder.rotation.z = 1.35;
      leftArm.shoulder.rotation.z = -1.35;
      return;
    }

    if (pose === 'idle') {
      const breath = Math.sin(t * 2.1) * 0.025 * motionScale;
      const sway = Math.sin(t * 1.05) * 0.03 * motionScale;

      hips.position.y = 0.94 + Math.abs(breath) * 0.35;
      hips.rotation.y = -0.14 + sway * 0.4;
      spine.rotation.x = 0.02 + breath * 0.5;
      spine.rotation.y = 0.08 + sway;
      head.rotation.y = -0.06 - sway * 0.8;
      head.rotation.x = 0.03 - breath * 0.4;

      // Heroic stance legs
      rightLeg.hip.rotation.set(0.08, -0.1, 0.05);
      rightLeg.knee.rotation.x = 0.12;
      rightLeg.ankle.rotation.x = -0.18;

      leftLeg.hip.rotation.set(-0.08, 0.12, -0.05);
      leftLeg.knee.rotation.x = 0.08;
      leftLeg.ankle.rotation.x = 0.0;

      // Sword held low & ready at side
      rightArm.shoulder.rotation.set(0.22 + breath, 0.08, 0.18 + Math.abs(breath) * 0.4);
      rightArm.elbow.rotation.set(-0.55 - breath * 0.8, 0.12, 0);
      rightArm.wrist.rotation.set(0.24, 0, -0.08);

      // Shield resting angled at left side
      leftArm.shoulder.rotation.set(-0.24, 0.22, -0.22 - Math.abs(breath) * 0.3);
      leftArm.elbow.rotation.set(-0.68, -0.18, 0.08);

      capePivot.rotation.x = 0.08 + Math.sin(t * 2.1 - 0.6) * 0.035 * motionScale;
      capePivot.rotation.z = Math.sin(t * 1.4) * 0.02 * motionScale;
    } else if (pose === 'guard') {
      const pulse = Math.sin(t * 2.6) * 0.03 * motionScale;

      hips.position.y = 0.89 + pulse * 0.3;
      hips.rotation.y = 0.34;
      spine.rotation.set(0.14, -0.26, 0);
      head.rotation.set(-0.08, 0.22 + pulse * 0.5, 0);

      // Braced defensive crouch
      leftLeg.hip.rotation.set(-0.28, 0.16, -0.06);
      leftLeg.knee.rotation.x = 0.48;
      leftLeg.ankle.rotation.x = -0.20;

      rightLeg.hip.rotation.set(0.24, -0.22, 0.08);
      rightLeg.knee.rotation.x = 0.32;
      rightLeg.ankle.rotation.x = -0.52;

      // Shield raised squarely in front
      leftArm.shoulder.rotation.set(-0.78 + pulse * 0.4, 0.58, -0.22);
      leftArm.elbow.rotation.set(-1.12, 0.35, 0.15);

      // Sword poised back ready to counter-thrust
      rightArm.shoulder.rotation.set(0.32, -0.35, 0.45);
      rightArm.elbow.rotation.set(-1.18 + pulse * 0.6, -0.25, 0.2);
      rightArm.wrist.rotation.x = 0.35;

      capePivot.rotation.x = 0.16 + Math.abs(pulse) * 1.2;
    } else if (pose === 'strike') {
      // Looping heroic overhead/diagonal slash cycle
      const cycle = (t * 0.72) % 1;
      let swing = 0;
      if (cycle < 0.38) {
        // Wind-up overhead
        const k = cycle / 0.38;
        swing = -Math.sin(k * Math.PI * 0.5); // 0 -> -1
      } else if (cycle < 0.58) {
        // Fast slash cleave
        const k = (cycle - 0.38) / 0.20;
        swing = -1 + 2 * (k * k * (3 - 2 * k)); // -1 -> +1
      } else {
        // Recovery back to neutral
        const k = (cycle - 0.58) / 0.42;
        swing = 1 - k * k * (3 - 2 * k); // +1 -> 0
      }
      if (motionScale === 0) swing = 0.75; // Static mid-cleave pose for reduced motion

      hips.position.y = 0.90 - Math.max(0, swing) * 0.05;
      hips.rotation.y = -0.25 * swing;
      spine.rotation.y = -0.38 * swing;
      spine.rotation.x = 0.10 + Math.max(0, swing) * 0.16;
      head.rotation.y = 0.45 * swing;

      rightLeg.hip.rotation.set(-0.22 * swing + 0.1, -0.14, 0.06);
      rightLeg.knee.rotation.x = 0.28 + Math.max(0, swing) * 0.18;
      rightLeg.ankle.rotation.x = -0.24;

      leftLeg.hip.rotation.set(0.18 * swing - 0.15, 0.14, -0.06);
      leftLeg.knee.rotation.x = 0.24;
      leftLeg.ankle.rotation.x = -0.08;

      // Right sword arm cleaves from high wind-up to low diagonal follow-through
      rightArm.shoulder.rotation.set(
        -1.35 + (swing + 1) * 0.95,
        -0.25 * swing,
        0.38 + (1 - swing) * 0.18
      );
      rightArm.elbow.rotation.set(-0.85 + Math.max(0, swing) * 0.55, 0, 0);
      rightArm.wrist.rotation.x = 0.35 + Math.max(0, swing) * 0.45;

      // Left shield arm counter-balances
      leftArm.shoulder.rotation.set(-0.48 - swing * 0.22, 0.35, -0.35);
      leftArm.elbow.rotation.set(-0.92, 0.1, 0);

      capePivot.rotation.x = 0.18 + Math.abs(swing) * 0.22;
      capePivot.rotation.z = swing * 0.16;
    } else if (pose === 'salute') {
      const breath = Math.sin(t * 1.8) * 0.02 * motionScale;

      hips.position.y = 0.95;
      spine.rotation.x = -0.05 + breath;
      head.rotation.x = -0.06;

      rightLeg.hip.rotation.set(0.03, -0.08, 0.03);
      leftLeg.hip.rotation.set(-0.03, 0.08, -0.03);

      // Knightly Sword Salute: blade held vertically upright before the visor!
      rightArm.shoulder.rotation.set(-1.12 + breath, -0.46, -0.18);
      rightArm.elbow.rotation.set(-1.18, 0.42, 0.48);
      rightArm.wrist.rotation.set(-0.62, 0.15, -0.25);

      leftArm.shoulder.rotation.set(-0.18, 0.15, -0.2);
      leftArm.elbow.rotation.set(-0.62, -0.15, 0);

      capePivot.rotation.x = 0.09 + Math.abs(breath);
    } else if (pose === 'march') {
      const walk = t * 3.4;
      const stride = Math.sin(walk) * motionScale;
      const counter = Math.cos(walk) * motionScale;

      hips.position.y = 0.93 + Math.abs(counter) * 0.035;
      hips.rotation.y = stride * 0.10;
      spine.rotation.y = -stride * 0.14;
      spine.rotation.x = 0.06;
      head.rotation.y = stride * 0.06;

      rightLeg.hip.rotation.x = -stride * 0.42;
      rightLeg.knee.rotation.x = Math.max(0, -counter) * 0.58 + 0.08;
      rightLeg.ankle.rotation.x = stride * 0.18;

      leftLeg.hip.rotation.x = stride * 0.42;
      leftLeg.knee.rotation.x = Math.max(0, counter) * 0.58 + 0.08;
      leftLeg.ankle.rotation.x = -stride * 0.18;

      rightArm.shoulder.rotation.set(stride * 0.34 + 0.15, 0.05, 0.18);
      rightArm.elbow.rotation.x = -0.62 - Math.max(0, -stride) * 0.2;

      leftArm.shoulder.rotation.set(-stride * 0.26 - 0.28, 0.25, -0.22);
      leftArm.elbow.rotation.x = -0.78;

      capePivot.rotation.x = 0.18 + Math.abs(stride) * 0.12;
      capePivot.rotation.z = -stride * 0.08;
    }
  }

  // Initialize in heroic idle pose
  updateAnimation('idle', 0, 0.016, 1);

  return {
    root,
    characterRoot,
    joints,
    materials,
    equipment,
    stats: {
      meshes: meshCount,
      vertices: vertexCount,
      triangles: triangleCount,
    },
    applyPalette,
    setVisorOpen,
    isVisorOpen: () => visorOpen,
    updateAnimation,
  };
}
