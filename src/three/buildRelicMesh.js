import * as THREE from 'three';

/**
 * Builds a procedural low-poly 3D Relic Trophy mesh for any of the 7 Eras.
 * Shared by both the floating trophies in QuestWorld3D and the 360-degree RelicViewer3D modal.
 */
export function createRelicMesh(eraId) {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a442,
    metalness: 0.55,
    roughness: 0.28,
    flatShading: true,
  });
  const warmGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf4db9f,
    metalness: 0.35,
    roughness: 0.32,
    emissive: 0x5c3e08,
    emissiveIntensity: 0.25,
    flatShading: true,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x8b2635,
    metalness: 0.25,
    roughness: 0.35,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8c5930,
    roughness: 0.72,
    flatShading: true,
  });
  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xf8f0dc,
    roughness: 0.65,
    flatShading: true,
  });
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x2e5c8a,
    metalness: 0.45,
    roughness: 0.22,
    flatShading: true,
  });
  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x2b6e6c,
    metalness: 0.45,
    roughness: 0.22,
    flatShading: true,
  });

  if (eraId === 'era-1') {
    // Scroll of Eden: rolled parchment + golden handles + crimson wax seal
    const scrollBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 12), parchmentMat);
    scrollBody.rotation.z = Math.PI / 2;
    group.add(scrollBody);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.82, 8), goldMat);
    rod.rotation.z = Math.PI / 2;
    group.add(rod);

    for (const side of [-0.92, 0.92]) {
      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), goldMat);
      finial.position.x = side;
      group.add(finial);
    }

    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.445, 0.22, 12), crimsonMat);
    ribbon.rotation.z = Math.PI / 2;
    group.add(ribbon);

    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 10), goldMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.z = 0.44;
    group.add(seal);
  } else if (eraId === 'era-2') {
    // Ark of the Nations: wooden ark + arched rainbow
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.48, 0.72), woodMat);
    hull.position.y = -0.22;
    group.add(hull);

    const keel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 0.56), woodMat);
    keel.position.y = -0.5;
    group.add(keel);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.54), goldMat);
    cabin.position.y = 0.16;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.28, 4), crimsonMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.35, 1, 0.65);
    roof.position.y = 0.45;
    group.add(roof);

    const rainbowColors = [0x8b2635, 0xd4a442, 0x2b6e6c];
    rainbowColors.forEach((col, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.95 - i * 0.11, 0.045, 6, 20, Math.PI),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, flatShading: true })
      );
      arc.position.set(0, -0.05, -0.18);
      group.add(arc);
    });
  } else if (eraId === 'era-3') {
    // Covenant Star: gleaming multi-faceted star + orbiting golden ring
    const starA = new THREE.Mesh(new THREE.OctahedronGeometry(0.76, 0), goldMat);
    const starB = new THREE.Mesh(new THREE.OctahedronGeometry(0.76, 0), warmGoldMat);
    starB.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    group.add(starA, starB);

    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.045, 8, 28), warmGoldMat);
    orbitRing.rotation.x = Math.PI / 3;
    group.add(orbitRing);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const mini = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), warmGoldMat);
      mini.position.set(Math.cos(angle) * 1.06, Math.sin(angle) * 0.5, Math.sin(angle) * 0.85);
      group.add(mini);
    }
  } else if (eraId === 'era-4') {
    // Scepter of Judah: golden staff + crimson royal orb + crown collar
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 1.85, 8), goldMat);
    staff.position.y = -0.18;
    group.add(staff);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 12), warmGoldMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.65;
    group.add(collar);

    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), crimsonMat);
    orb.position.y = 0.92;
    group.add(orb);

    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
    tip.position.y = 1.36;
    group.add(tip);
    group.rotation.z = -0.22;
  } else if (eraId === 'era-5') {
    // Crown of David with Matthew 1 Sapphire & Luke 3 Teal jewels
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.72, 0.42, 12, 1, true), goldMat);
    band.material.side = THREE.DoubleSide;
    band.position.y = -0.18;
    group.add(band);

    const velvet = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.66, 0.36, 12), crimsonMat);
    velvet.position.y = -0.16;
    group.add(velvet);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 4), goldMat);
      spike.position.set(Math.cos(angle) * 0.72, 0.24, Math.sin(angle) * 0.72);
      group.add(spike);

      const jewelMat = i % 2 === 0 ? blueMat : tealMat;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), jewelMat);
      gem.position.set(Math.cos(angle) * 0.78, -0.18, Math.sin(angle) * 0.78);
      group.add(gem);
    }
  } else if (eraId === 'era-6') {
    // Daniel's 70-Weeks Prophetic Dial
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.16, 18), parchmentMat);
    face.rotation.x = Math.PI / 2;
    group.add(face);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.09, 8, 24), goldMat);
    group.add(rim);

    const outerGear = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.04, 6, 18), warmGoldMat);
    outerGear.rotation.y = 0.35;
    group.add(outerGear);

    const handLong = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 0.08), crimsonMat);
    handLong.position.set(0, 0.22, 0.11);
    group.add(handLong);

    const handShort = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.08), blueMat);
    handShort.position.set(0.18, -0.02, 0.11);
    group.add(handShort);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), goldMat);
    hub.position.z = 0.12;
    group.add(hub);
  } else {
    // Era 7: Crown of the Promised Offspring (twin converging rings + radiant star + crimson core)
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 0), crimsonMat);
    group.add(core);

    const ringMatt = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.065, 8, 24), blueMat);
    ringMatt.rotation.set(0.55, 0.3, 0);
    group.add(ringMatt);

    const ringLuke = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.065, 8, 24), tealMat);
    ringLuke.rotation.set(-0.55, -0.3, 0);
    group.add(ringLuke);

    const rays = [
      [0, 1.05, 0, 0, 0, 0],
      [0, -1.05, 0, Math.PI, 0, 0],
      [1.05, 0, 0, 0, 0, -Math.PI / 2],
      [-1.05, 0, 0, 0, 0, Math.PI / 2],
    ];
    for (const [x, y, z, rx, ry, rz] of rays) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.65, 4), warmGoldMat);
      cone.position.set(x, y, z);
      cone.rotation.set(rx, ry, rz);
      group.add(cone);
    }
  }

  return group;
}
