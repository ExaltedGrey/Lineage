import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { X, ExternalLink, RotateCw, Award } from 'lucide-react';
import { createRelicMesh } from '../three/buildRelicMesh';

export default function RelicViewer3D({ relic, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!relic) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [relic, onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !relic) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.35, 3.8);

    const hemi = new THREE.HemisphereLight(0xfffaf0, 0x1b3647, 1.15);
    const keyLight = new THREE.DirectionalLight(0xfff2d2, 1.5);
    keyLight.position.set(4, 5, 6);
    const backLight = new THREE.DirectionalLight(0x98c4d8, 0.7);
    backLight.position.set(-4, -2, -4);
    scene.add(hemi, keyLight, backLight);

    const mesh = createRelicMesh(relic.eraId);
    scene.add(mesh);

    // Subtle sparkle ring behind trophy
    const sparkleRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.025, 6, 32),
      new THREE.MeshStandardMaterial({
        color: 0xf4db9f,
        emissive: 0xb88a36,
        emissiveIntensity: 0.65,
      })
    );
    sparkleRing.rotation.x = Math.PI / 2.6;
    scene.add(sparkleRing);

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

    // Interactive 360-degree finger/mouse spin
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotY = 0;
    let rotX = 0.15;

    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e) => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.012;
      rotX = Math.max(-0.85, Math.min(0.85, rotX + (e.clientY - lastY) * 0.01));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging = false;
    };

    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);

    let rafId = 0;
    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      const t = now * 0.001;
      if (!dragging) rotY += 0.012;
      mesh.rotation.y = rotY;
      mesh.rotation.x = rotX;
      mesh.position.y = Math.sin(t * 2.2) * 0.08;
      sparkleRing.rotation.z = t * 0.6;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      renderer.dispose();
    };
  }, [relic]);

  if (!relic) return null;

  return (
    <div className="relic-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={relic.relicName}>
      <div className="relic-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="relic-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="#F4DB9F" />
            <span className="relic-modal-kicker">3D Collectible Relic · Stop {relic.chapter}</span>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close 3D Relic Viewer">
            <X size={17} />
          </button>
        </div>

        <div className="relic-viewer-stage">
          <canvas ref={canvasRef} className="relic-viewer-canvas" />
          <span className="relic-spin-hint">
            <RotateCw size={12} /> Drag to spin 360°!
          </span>
        </div>

        <div className="relic-modal-body">
          <h3 className="relic-modal-title">{relic.relicName}</h3>
          <p className="relic-modal-sub">{relic.eraTitle} · {relic.years}</p>
          <p className="relic-modal-fact">{relic.funFactBody}</p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            <a
              href={relic.familyReadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-crimson"
              style={{ flex: 1 }}
            >
              <ExternalLink size={14} />
              <span>Read {relic.familyReadRef} (JW Library)</span>
            </a>
            <button type="button" className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
