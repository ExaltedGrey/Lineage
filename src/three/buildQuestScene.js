import * as THREE from 'three';
import { createRelicMesh } from './buildRelicMesh';

/**
 * Interactive 3D Storybook Daylight Diorama for "The Promised Offspring" Quest Tour.
 * Features 7 handcrafted low-poly Bible islands, animated ocean waves, splitting
 * Matthew 1 (Blue) & Luke 3 (Teal) bridges, an animated hopping Explorer Pawn,
 * raycast island selection, drag-to-orbit, and 3D starburst celebrations!
 */

const ISLAND_COORDS = [
  new THREE.Vector3(-12.6, 0, 1.2),   // Era 1: Eden
  new THREE.Vector3(-8.4, 0, -1.5),   // Era 2: Flood & Ark
  new THREE.Vector3(-4.2, 0, 1.3),    // Era 3: Patriarchs
  new THREE.Vector3(0.0, 0, -1.3),    // Era 4: Twelve Tribes
  new THREE.Vector3(4.2, 0, 1.3),     // Era 5: House of David (splits into 2 bridges!)
  new THREE.Vector3(8.5, 0, -1.1),    // Era 6: Exile & 70 Weeks
  new THREE.Vector3(12.8, 0.25, 0.8), // Era 7: The Promised Offspring
];

const ERA_IDS = ['era-1', 'era-2', 'era-3', 'era-4', 'era-5', 'era-6', 'era-7'];

function createLowPolyTree(x, y, z, scale = 1, leafColor = 0x2e7d57) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.13 * scale, 0.55 * scale, 6),
    new THREE.MeshStandardMaterial({ color: 0x7b4f2b, roughness: 0.85, flatShading: true })
  );
  trunk.position.y = 0.26 * scale;
  trunk.castShadow = true;

  const crown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.42 * scale, 0),
    new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.72, flatShading: true })
  );
  crown.position.y = 0.68 * scale;
  crown.castShadow = true;

  tree.add(trunk, crown);
  tree.position.set(x, y, z);
  return tree;
}

function createIslandBase(topColor, cliffColor = 0xc6b497, radius = 1.62) {
  const base = new THREE.Group();
  const cliff = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.68, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: cliffColor, roughness: 0.88, flatShading: true })
  );
  cliff.position.y = -0.45;
  cliff.receiveShadow = true;
  cliff.castShadow = true;

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.03, radius, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.8, flatShading: true })
  );
  cap.position.y = 0.08;
  cap.receiveShadow = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.06, 0.04, 6, 20),
    new THREE.MeshStandardMaterial({
      color: 0xb88a36,
      metalness: 0.45,
      roughness: 0.35,
      flatShading: true,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;

  base.add(cliff, cap, ring);
  return base;
}

export function mountQuestWorld3D(canvas, { onSelectEra, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefe6d4);
  scene.fog = new THREE.FogExp2(0xefe6d4, 0.022);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 120);
  const currentLookAt = ISLAND_COORDS[0].clone().add(new THREE.Vector3(0, 0.5, 0));
  const targetLookAt = currentLookAt.clone();
  let orbitYawOffset = 0;
  let orbitPitchOffset = 0;

  // Warm Storybook Daylight Lighting
  const hemiLight = new THREE.HemisphereLight(0xfffaf0, 0x2b5668, 0.95);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff4dd, 1.35);
  sunLight.position.set(10, 18, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 55;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 12;
  sunLight.shadow.camera.bottom = -12;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0xb8d8e8, 0.45);
  rimLight.position.set(-14, 9, -10);
  scene.add(rimLight);

  // Stylized Ocean Plane
  const waterGeo = new THREE.PlaneGeometry(74, 34, 38, 18);
  const waterPosAttr = waterGeo.attributes.position;
  const waterBaseZ = new Float32Array(waterPosAttr.count);
  for (let i = 0; i < waterPosAttr.count; i++) {
    waterBaseZ[i] = waterPosAttr.getZ(i);
  }
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a6678,
    roughness: 0.32,
    metalness: 0.18,
    flatShading: true,
    transparent: true,
    opacity: 0.9,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.62;
  water.receiveShadow = true;
  scene.add(water);

  // Soft Drifting Low-Poly Clouds
  const clouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xfdfaf3,
    roughness: 0.95,
    flatShading: true,
  });
  for (let i = 0; i < 9; i++) {
    const cloud = new THREE.Group();
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), cloudMat);
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), cloudMat);
    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.44, 0), cloudMat);
    c2.position.set(0.58, -0.08, 0.08);
    c3.position.set(-0.55, -0.1, -0.06);
    cloud.add(c1, c2, c3);
    cloud.position.set(-16 + i * 4.2, 4.3 + (i % 3) * 0.65, -4.5 - (i % 2) * 2.2);
    cloud.scale.setScalar(0.85 + (i % 3) * 0.22);
    scene.add(cloud);
    clouds.push(cloud);
  }

  // Build All 7 Handcrafted Era Islands
  const islandGroups = [];
  const hitMeshes = [];
  const animatedProps = [];
  const relicHolders = [];
  const activeRings = [];

  const goldSteppingMat = new THREE.MeshStandardMaterial({
    color: 0xd9ac4e,
    metalness: 0.35,
    roughness: 0.4,
    flatShading: true,
  });

  ISLAND_COORDS.forEach((coord, idx) => {
    const eraId = ERA_IDS[idx];
    const island = new THREE.Group();
    island.position.copy(coord);
    island.userData.eraIndex = idx;

    // Invisible generous tap target cylinder for easy mobile tapping
    const hitCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 2.8, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitCyl.position.y = 0.8;
    hitCyl.userData.eraIndex = idx;
    island.add(hitCyl);
    hitMeshes.push(hitCyl);

    // Highlight halo ring around active island
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.88, 0.075, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0xf4db9f,
        emissive: 0xb88a36,
        emissiveIntensity: 0.75,
        roughness: 0.25,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.2;
    halo.visible = idx === 0;
    island.add(halo);
    activeRings.push(halo);

    // Build Era-Specific Diorama Props
    if (idx === 0) {
      // ERA 1: EDEN
      island.add(createIslandBase(0x4b8f5c, 0xa89274));
      island.add(createLowPolyTree(-0.75, 0.2, -0.45, 1.05, 0x2e7d57));
      island.add(createLowPolyTree(0.8, 0.2, -0.25, 0.9, 0x3b9469));
      island.add(createLowPolyTree(-0.55, 0.2, 0.65, 0.75, 0x29724e));
      // Center golden tree of life accent
      const centerTree = createLowPolyTree(0.05, 0.2, 0.0, 1.25, 0x266b49);
      const goldenOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: 0xf4db9f, emissive: 0xb88a36, emissiveIntensity: 0.6 })
      );
      goldenOrb.position.set(0.05, 1.15, 0.35);
      island.add(centerTree, goldenOrb);
      animatedProps.push({ obj: goldenOrb, type: 'bob', baseY: 1.15, speed: 2.2 });
    } else if (idx === 1) {
      // ERA 2: FLOOD & ARK
      island.add(createIslandBase(0x558a78, 0x7b8c94));
      const arkGroup = new THREE.Group();
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.42, 0.62),
        new THREE.MeshStandardMaterial({ color: 0x87542c, roughness: 0.78, flatShading: true })
      );
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.32, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xb07540, roughness: 0.75, flatShading: true })
      );
      deck.position.y = 0.3;
      arkGroup.add(hull, deck);
      arkGroup.position.set(0, 0.44, 0.1);
      arkGroup.rotation.y = 0.25;
      island.add(arkGroup);
      animatedProps.push({ obj: arkGroup, type: 'rock', speed: 1.8 });

      // Rainbow arch
      [0x8b2635, 0xd4a442, 0x2e7d57, 0x2e5c8a].forEach((col, cIdx) => {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(1.3 - cIdx * 0.09, 0.04, 6, 22, Math.PI),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
        );
        arc.position.set(0, 0.22, -0.35);
        island.add(arc);
      });
    } else if (idx === 2) {
      // ERA 3: PATRIARCHS' CAMP
      island.add(createIslandBase(0xd9be8a, 0xb89662));
      const tent = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 0.92, 4),
        new THREE.MeshStandardMaterial({ color: 0xf4ebd6, roughness: 0.85, flatShading: true })
      );
      tent.position.set(-0.25, 0.62, -0.1);
      tent.rotation.y = Math.PI / 4;
      tent.castShadow = true;
      island.add(tent);

      const stripe = new THREE.Mesh(
        new THREE.ConeGeometry(0.77, 0.22, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.8, flatShading: true })
      );
      stripe.position.set(-0.25, 0.95, -0.1);
      stripe.rotation.y = Math.PI / 4;
      island.add(stripe);

      // Campfire ember + orbiting stars
      const fire = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        new THREE.MeshStandardMaterial({ color: 0xf4a236, emissive: 0xd96b18, emissiveIntensity: 0.9 })
      );
      fire.position.set(0.6, 0.34, 0.45);
      island.add(fire);
      animatedProps.push({ obj: fire, type: 'pulse', speed: 5.5 });

      const starCluster = new THREE.Group();
      starCluster.position.set(0, 1.55, 0);
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2;
        const st = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshStandardMaterial({ color: 0xf4db9f, emissive: 0xb88a36, emissiveIntensity: 0.55 })
        );
        st.position.set(Math.cos(a) * 0.72, (s % 2) * 0.18, Math.sin(a) * 0.72);
        starCluster.add(st);
      }
      island.add(starCluster);
      animatedProps.push({ obj: starCluster, type: 'spin', speed: 0.85 });
    } else if (idx === 3) {
      // ERA 4: TWELVE TRIBES & JUDAH'S SCEPTER
      island.add(createIslandBase(0x88995a, 0xb09878));
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1b3647, roughness: 0.6, flatShading: true });
      const judahMat = new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.45, flatShading: true });
      for (let t = 0; t < 12; t++) {
        const ang = (t / 12) * Math.PI * 2;
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, t === 3 ? 0.65 : 0.42, 0.18),
          t === 3 ? judahMat : stoneMat
        );
        pillar.position.set(Math.cos(ang) * 0.98, 0.38, Math.sin(ang) * 0.98);
        pillar.castShadow = true;
        island.add(pillar);
      }
      // Golden center sheaf/scepter monument
      const monument = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.95, 6), goldSteppingMat);
      monument.position.y = 0.65;
      island.add(monument);
    } else if (idx === 4) {
      // ERA 5: HOUSE OF DAVID CITADEL
      island.add(createIslandBase(0xc9b38c, 0x9c8868, 1.72));
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e4cc, roughness: 0.72, flatShading: true });
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 1.0), wallMat);
      keep.position.y = 0.65;
      keep.castShadow = true;
      island.add(keep);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.88, 0.48, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.5, flatShading: true })
      );
      roof.position.y = 1.35;
      roof.rotation.y = Math.PI / 4;
      island.add(roof);

      // Left Blue & Right Teal twin turrets representing Matthew 1 & Luke 3!
      const mattTower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 1.15, 6),
        new THREE.MeshStandardMaterial({ color: 0x2e5c8a, roughness: 0.45, flatShading: true })
      );
      mattTower.position.set(-0.78, 0.72, 0.32);
      const lukeTower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 1.15, 6),
        new THREE.MeshStandardMaterial({ color: 0x2b6e6c, roughness: 0.45, flatShading: true })
      );
      lukeTower.position.set(0.78, 0.72, -0.32);
      island.add(mattTower, lukeTower);
    } else if (idx === 5) {
      // ERA 6: EXILE & 70-WEEKS CLOCKTOWER
      island.add(createIslandBase(0xbda98a, 0x8d7e69));
      const gateMat = new THREE.MeshStandardMaterial({ color: 0xe6d8be, roughness: 0.75, flatShading: true });
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.45), gateMat);
      leftPillar.position.set(-0.52, 0.65, 0);
      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.45), gateMat);
      rightPillar.position.set(0.52, 0.65, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.24, 0.52), gateMat);
      lintel.position.set(0, 1.22, 0);
      island.add(leftPillar, rightPillar, lintel);

      const gear = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 12), goldSteppingMat);
      gear.position.set(0, 1.72, 0);
      island.add(gear);
      animatedProps.push({ obj: gear, type: 'spinY', speed: 1.3 });
    } else {
      // ERA 7: THE PROMISED OFFSPRING SANCTUARY
      island.add(createIslandBase(0x8b2635, 0xb88a36, 1.85));
      const dais = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.32, 0.34, 8),
        new THREE.MeshStandardMaterial({ color: 0xf8f0dc, roughness: 0.55, flatShading: true })
      );
      dais.position.y = 0.34;
      island.add(dais);

      const grandStar = new THREE.Group();
      const s1 = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({
          color: 0xf4db9f,
          emissive: 0xd4a442,
          emissiveIntensity: 0.65,
          metalness: 0.45,
          roughness: 0.2,
          flatShading: true,
        })
      );
      const s2 = s1.clone();
      s2.rotation.set(Math.PI / 4, Math.PI / 4, 0);
      grandStar.add(s1, s2);
      grandStar.position.y = 1.35;
      island.add(grandStar);
      animatedProps.push({ obj: grandStar, type: 'spinBob', baseY: 1.35, speed: 1.2 });
    }

    // Floating Mini 3D Relic Trophy above completed islands
    const relicHolder = createRelicMesh(eraId);
    relicHolder.scale.setScalar(0.36);
    relicHolder.position.set(0, 2.35, 0);
    relicHolder.visible = false;
    island.add(relicHolder);
    relicHolders.push(relicHolder);

    scene.add(island);
    islandGroups.push(island);
  });

  // Connect Islands with Golden Stepping Stones — and SPLIT into Twin Bridges between Era 5 -> 6 -> 7!
  const addBridge = (start, end, color, lateralOffset = 0, arcHeight = 0.35) => {
    const mid = start.clone().lerp(end, 0.5);
    const dir = end.clone().sub(start).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    mid.addScaledVector(perp, lateralOffset);
    mid.y += arcHeight;

    const curve = new THREE.QuadraticBezierCurve3(
      start.clone().add(new THREE.Vector3(0, 0.14, 0)),
      mid,
      end.clone().add(new THREE.Vector3(0, 0.14, 0))
    );
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.09, 6, false),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.22,
        roughness: 0.35,
        flatShading: true,
      })
    );
    scene.add(tube);
  };

  for (let i = 0; i < ISLAND_COORDS.length - 1; i++) {
    if (i === 4 || i === 5) {
      // Twin Matthew 1 (Blue) & Luke 3 (Teal) Bridges!
      addBridge(ISLAND_COORDS[i], ISLAND_COORDS[i + 1], 0x2e5c8a, 0.85, 0.45);
      addBridge(ISLAND_COORDS[i], ISLAND_COORDS[i + 1], 0x2b6e6c, -0.85, 0.45);
    } else {
      addBridge(ISLAND_COORDS[i], ISLAND_COORDS[i + 1], 0xd4a442, 0, 0.28);
    }
  }

  // Cute Animated 3D Explorer Pawn (Golden Scroll Lantern / Pip Token)
  const pawn = new THREE.Group();
  const pawnBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0x1b3647, roughness: 0.4, flatShading: true })
  );
  const pawnBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0xf4db9f,
      emissive: 0xb88a36,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      flatShading: true,
    })
  );
  pawnBody.position.y = 0.36;
  const pawnCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.28, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.45, flatShading: true })
  );
  pawnCap.position.y = 0.68;
  pawn.add(pawnBase, pawnBody, pawnCap);
  pawn.position.copy(ISLAND_COORDS[0]).add(new THREE.Vector3(0, 0.38, 1.12));
  scene.add(pawn);

  const pawnHop = {
    active: false,
    progress: 1,
    from: pawn.position.clone(),
    to: pawn.position.clone(),
  };

  // 3D Starburst Firework Particles
  const particles = [];
  const starGeo = new THREE.OctahedronGeometry(0.13, 0);
  const particleColors = [0xf4db9f, 0xd4a442, 0x8b2635, 0x2e5c8a, 0x2b6e6c];

  function triggerCelebration(eraIndex) {
    if (reducedMotion) return;
    const origin = ISLAND_COORDS[eraIndex] || ISLAND_COORDS[0];
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: particleColors[i % particleColors.length],
        emissive: particleColors[i % particleColors.length],
        emissiveIntensity: 0.55,
        roughness: 0.25,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.position.set(origin.x, origin.y + 0.8, origin.z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 2.8;
      scene.add(mesh);
      particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          4.2 + Math.random() * 3.8,
          Math.sin(angle) * speed
        ),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.7,
      });
    }
  }

  // Interactive Orbit + Tap Raycasting
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let isPointerDown = false;
  let pointerMoved = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const onPointerDown = (e) => {
    isPointerDown = true;
    pointerMoved = false;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  };

  const onPointerMove = (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) pointerMoved = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    orbitYawOffset = Math.max(-0.65, Math.min(0.65, orbitYawOffset - dx * 0.005));
    orbitPitchOffset = Math.max(-0.22, Math.min(0.32, orbitPitchOffset + dy * 0.003));
  };

  const onPointerUp = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (pointerMoved) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitMeshes, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.eraIndex;
      if (typeof idx === 'number') {
        onSelectEra?.(idx);
      }
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // Resize Handling
  const handleResize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  handleResize();
  const ro = new ResizeObserver(handleResize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);

  // External State Sync Methods
  function setActiveEra(idx) {
    const clamped = Math.max(0, Math.min(ISLAND_COORDS.length - 1, idx));
    const dest = ISLAND_COORDS[clamped];
    targetLookAt.set(dest.x, dest.y + 0.55, dest.z);
    orbitYawOffset *= 0.25;
    orbitPitchOffset *= 0.25;

    activeRings.forEach((ring, i) => {
      ring.visible = i === clamped;
    });

    const newPawnDest = dest.clone().add(new THREE.Vector3(0, 0.36, 1.15));
    if (pawn.position.distanceTo(newPawnDest) > 0.2) {
      pawnHop.from.copy(pawn.position);
      pawnHop.to.copy(newPawnDest);
      pawnHop.progress = 0;
      pawnHop.active = true;
    }
  }

  function setCompletedEras(completedIds = []) {
    const set = new Set(completedIds);
    ERA_IDS.forEach((id, idx) => {
      if (relicHolders[idx]) {
        relicHolders[idx].visible = set.has(id);
      }
    });
  }

  function resetCamera() {
    orbitYawOffset = 0;
    orbitPitchOffset = 0;
  }

  // Animation Loop
  let rafId = 0;
  let lastTime = performance.now();

  const animate = (now) => {
    rafId = requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const t = now * 0.001;

    // Gentle ocean wave motion
    if (!reducedMotion) {
      for (let i = 0; i < waterPosAttr.count; i++) {
        const vx = waterPosAttr.getX(i);
        const vy = waterPosAttr.getY(i);
        const wave = Math.sin(vx * 0.45 + t * 1.4) * 0.1 + Math.cos(vy * 0.5 + t * 1.1) * 0.08;
        waterPosAttr.setZ(i, waterBaseZ[i] + wave);
      }
      waterPosAttr.needsUpdate = true;

      clouds.forEach((c, i) => {
        c.position.x += dt * (0.22 + (i % 3) * 0.06);
        if (c.position.x > 22) c.position.x = -22;
      });

      // Animate era-specific props
      animatedProps.forEach((p) => {
        if (p.type === 'bob') {
          p.obj.position.y = p.baseY + Math.sin(t * p.speed) * 0.14;
        } else if (p.type === 'rock') {
          p.obj.rotation.z = Math.sin(t * p.speed) * 0.07;
          p.obj.rotation.x = Math.cos(t * p.speed * 0.8) * 0.04;
        } else if (p.type === 'pulse') {
          const s = 0.88 + Math.sin(t * p.speed) * 0.18;
          p.obj.scale.setScalar(s);
        } else if (p.type === 'spin') {
          p.obj.rotation.y = t * p.speed;
        } else if (p.type === 'spinY') {
          p.obj.rotation.z = t * p.speed;
        } else if (p.type === 'spinBob') {
          p.obj.rotation.y = t * p.speed;
          p.obj.position.y = p.baseY + Math.sin(t * 2.0) * 0.14;
        }
      });

      // Float & spin unlocked 3D Relics
      relicHolders.forEach((r, idx) => {
        if (r.visible) {
          r.rotation.y = t * 1.4 + idx;
          r.position.y = 2.32 + Math.sin(t * 2.2 + idx) * 0.12;
        }
      });
    }

    // Parabolic pawn hop
    if (pawnHop.active) {
      pawnHop.progress = Math.min(1, pawnHop.progress + dt * 2.1);
      const u = pawnHop.progress;
      const ease = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      pawn.position.lerpVectors(pawnHop.from, pawnHop.to, ease);
      pawn.position.y += Math.sin(u * Math.PI) * 1.45;
      if (pawnHop.progress >= 1) pawnHop.active = false;
    } else if (!reducedMotion) {
      pawn.position.y = pawnHop.to.y + Math.sin(t * 3.1) * 0.06;
    }

    // Update celebration particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 9.2 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 5 * dt;
      p.mesh.rotation.y += 6 * dt;
      const scale = Math.max(0.01, 1 - p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);
    }

    // Smooth camera orbit follow
    currentLookAt.lerp(targetLookAt, Math.min(1, dt * 5.2));
    const dist = canvas.clientWidth < 600 ? 9.8 : 8.6;
    const pitch = 0.56 + orbitPitchOffset;
    const yaw = orbitYawOffset;
    camera.position.set(
      currentLookAt.x + Math.sin(yaw) * dist,
      currentLookAt.y + Math.sin(pitch) * dist,
      currentLookAt.z + Math.cos(yaw) * Math.cos(pitch) * dist
    );
    camera.lookAt(currentLookAt);

    renderer.render(scene, camera);
  };

  rafId = requestAnimationFrame(animate);

  return {
    setActiveEra,
    setCompletedEras,
    triggerCelebration,
    resetCamera,
    dispose() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      particles.forEach((p) => p.mesh.material.dispose());
      starGeo.dispose();
      renderer.dispose();
    },
  };
}
