'use client';

/**
 * Ring3DViewer — Real Three.js 3D ring configurator
 *
 * • Band: TorusGeometry with metalness/roughness per metal type
 * • Diamond: custom faceted geometry per shape (octahedron-derived)
 * • Prongs: 6 small cylinders holding the diamond
 * • Orbit: drag to rotate, pinch/scroll to zoom
 * • No external dependencies beyond three (already installed)
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ── Metal material presets ────────────────────────────────────────────────────
const METAL_PRESETS: Record<string, { color: number; metalness: number; roughness: number }> = {
  platinum:    { color: 0xd8dde4, metalness: 0.95, roughness: 0.08 },
  '18ct white gold': { color: 0xdde2e8, metalness: 0.90, roughness: 0.10 },
  '18ct yellow gold': { color: 0xd4a850, metalness: 0.92, roughness: 0.07 },
  '18ct rose gold':   { color: 0xc97060, metalness: 0.90, roughness: 0.10 },
  '9ct yellow gold':  { color: 0xd4a850, metalness: 0.85, roughness: 0.14 },
  '9ct white gold':   { color: 0xd8d8d8, metalness: 0.85, roughness: 0.14 },
  '9ct rose gold':    { color: 0xc97060, metalness: 0.85, roughness: 0.14 },
};

// ── Diamond shape geometry builders ──────────────────────────────────────────
function buildDiamondGeometry(shape: string, caratScale = 1): THREE.BufferGeometry {
  const s = shape?.toLowerCase() || 'round';
  const r = 0.18 * Math.cbrt(caratScale); // radius scales with carat (visual only)
  const h = r * 1.1;

  // All shapes are approximated as modified octahedra / pyramids
  // Top crown + bottom pavilion
  let geom: THREE.BufferGeometry;

  if (s === 'round' || s === 'oval') {
    const radials = s === 'oval' ? 24 : 28;
    geom = buildRoundBrilliant(r, h, radials, s === 'oval' ? 0.68 : 1.0);
  } else if (s === 'princess' || s === 'cushion' || s === 'asscher') {
    geom = buildSquareDiamond(r, h, s === 'cushion' ? 0.3 : 0.08);
  } else if (s === 'emerald' || s === 'radiant') {
    geom = buildRectDiamond(r * 1.2, r * 0.82, h);
  } else if (s === 'pear') {
    geom = buildPearDiamond(r, h);
  } else if (s === 'marquise') {
    geom = buildMarquiseDiamond(r, h);
  } else if (s === 'heart') {
    geom = buildRoundBrilliant(r, h, 24, 1.0); // simplified
  } else {
    geom = buildRoundBrilliant(r, h, 28, 1.0);
  }

  geom.computeVertexNormals();
  return geom;
}

function buildRoundBrilliant(r: number, h: number, segs: number, xScale: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  // Crown top (table) — flat octagon at y = h*0.18
  const tableR = r * 0.52;
  const tableY = h * 0.18;
  const crownY = h * 0.28;
  const girdleY = 0;
  const pavilionY = -h * 0.72;

  // Center of table
  const iTable = 0;
  positions.push(0, tableY, 0); // table center

  // Table ring
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    positions.push(tableR * Math.cos(a) * xScale, tableY, tableR * Math.sin(a));
  }
  // Crown girdle ring
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    positions.push(r * Math.cos(a) * xScale, crownY, r * Math.sin(a));
  }
  // Girdle ring (equator)
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    positions.push(r * Math.cos(a) * xScale, girdleY, r * Math.sin(a));
  }
  // Pavilion culet
  const iCulet = 1 + segs * 3;
  positions.push(0, pavilionY, 0);

  // Table to table ring fans
  for (let i = 0; i < segs; i++) {
    const a = 1 + i, b = 1 + (i + 1) % segs;
    indices.push(iTable, a, b);
  }
  // Table ring to crown ring
  const crownOff = 1 + segs;
  for (let i = 0; i < segs; i++) {
    const a0 = 1 + i, a1 = 1 + (i + 1) % segs;
    const b0 = crownOff + i, b1 = crownOff + (i + 1) % segs;
    indices.push(a0, b0, a1);
    indices.push(a1, b0, b1);
  }
  // Crown to girdle
  const girdleOff = 1 + segs * 2;
  for (let i = 0; i < segs; i++) {
    const a0 = crownOff + i, a1 = crownOff + (i + 1) % segs;
    const b0 = girdleOff + i, b1 = girdleOff + (i + 1) % segs;
    indices.push(a0, b0, a1);
    indices.push(a1, b0, b1);
  }
  // Girdle to culet
  for (let i = 0; i < segs; i++) {
    const a = girdleOff + i, b = girdleOff + (i + 1) % segs;
    indices.push(a, iCulet, b);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

function buildSquareDiamond(r: number, h: number, cornerRound: number): THREE.BufferGeometry {
  const pts: [number, number][] = [];
  const segs = 4;
  const tableR = r * 0.52;
  const tableY = h * 0.18;
  const crownY = h * 0.28;
  const pavilionY = -h * 0.72;

  // Square corners
  const sqPts: [number, number][] = [[-r, -r], [r, -r], [r, r], [-r, r]];
  const sqTable: [number, number][] = [[-tableR, -tableR], [tableR, -tableR], [tableR, tableR], [-tableR, tableR]];

  const positions: number[] = [0, tableY, 0]; // 0: table center
  sqTable.forEach(([x, z]) => positions.push(x, tableY, z));  // 1-4: table ring
  sqPts.forEach(([x, z]) => positions.push(x, crownY, z));    // 5-8: crown
  sqPts.forEach(([x, z]) => positions.push(x, 0, z));         // 9-12: girdle
  positions.push(0, pavilionY, 0);                              // 13: culet

  const indices: number[] = [];
  // Table
  indices.push(0,1,2, 0,2,3, 0,3,4, 0,4,1);
  // Table → Crown
  for (let i = 0; i < 4; i++) {
    const a0 = 1+i, a1 = 1+(i+1)%4, b0 = 5+i, b1 = 5+(i+1)%4;
    indices.push(a0,b0,a1, a1,b0,b1);
  }
  // Crown → Girdle
  for (let i = 0; i < 4; i++) {
    const a0 = 5+i, a1 = 5+(i+1)%4, b0 = 9+i, b1 = 9+(i+1)%4;
    indices.push(a0,b0,a1, a1,b0,b1);
  }
  // Girdle → Culet
  for (let i = 0; i < 4; i++) {
    const a = 9+i, b = 9+(i+1)%4;
    indices.push(a, 13, b);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

function buildRectDiamond(rw: number, rh: number, h: number): THREE.BufferGeometry {
  const tableY = h * 0.18, crownY = h * 0.28, pavilionY = -h * 0.72;
  const tw = rw * 0.52, th = rh * 0.52;
  const positions: number[] = [
    0, tableY, 0,                    // 0 table center
    -tw, tableY, -th,                // 1
     tw, tableY, -th,                // 2
     tw, tableY,  th,                // 3
    -tw, tableY,  th,                // 4
    -rw, crownY, -rh,               // 5
     rw, crownY, -rh,               // 6
     rw, crownY,  rh,               // 7
    -rw, crownY,  rh,               // 8
    -rw, 0, -rh,                    // 9
     rw, 0, -rh,                    // 10
     rw, 0,  rh,                    // 11
    -rw, 0,  rh,                    // 12
     0, pavilionY, 0,                // 13
  ];
  const indices = [
    0,1,2, 0,2,3, 0,3,4, 0,4,1,
    1,5,2, 2,5,6, 2,6,3, 3,6,7, 3,7,4, 4,7,8, 4,8,1, 1,8,5,
    5,9,6, 6,9,10, 6,10,7, 7,10,11, 7,11,8, 8,11,12, 8,12,5, 5,12,9,
    9,13,10, 10,13,11, 11,13,12, 12,13,9,
  ];
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

function buildPearDiamond(r: number, h: number): THREE.BufferGeometry {
  // Approx pear with 20 segments, elongated on one side
  const segs = 20;
  const tableY = h * 0.18, crownY = h * 0.28, pavilionY = -h * 0.72;
  const tableR = r * 0.45;
  const positions: number[] = [0, tableY, 0];

  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const xScale = 0.85;
    const yOff = -r * 0.2 * Math.sin(a); // elongate toward bottom
    positions.push(tableR * Math.cos(a) * xScale, tableY, tableR * Math.sin(a) + yOff * 0.4);
  }
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const xScale = 0.85;
    const yOff = -r * 0.3 * Math.sin(a);
    positions.push(r * Math.cos(a) * xScale, crownY, r * Math.sin(a) + yOff * 0.5);
  }
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const xScale = 0.85;
    const yOff = -r * 0.3 * Math.sin(a);
    positions.push(r * Math.cos(a) * xScale, 0, r * Math.sin(a) + yOff * 0.5);
  }
  const culet = 1 + segs * 3;
  positions.push(0, pavilionY, 0);

  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    indices.push(0, 1+i, 1+(i+1)%segs);
  }
  for (let i = 0; i < segs; i++) {
    const a0 = 1+i, a1 = 1+(i+1)%segs, b0 = 1+segs+i, b1 = 1+segs+(i+1)%segs;
    indices.push(a0,b0,a1, a1,b0,b1);
  }
  for (let i = 0; i < segs; i++) {
    const a0 = 1+segs+i, a1 = 1+segs+(i+1)%segs, b0 = 1+segs*2+i, b1 = 1+segs*2+(i+1)%segs;
    indices.push(a0,b0,a1, a1,b0,b1);
  }
  for (let i = 0; i < segs; i++) {
    indices.push(1+segs*2+i, culet, 1+segs*2+(i+1)%segs);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

function buildMarquiseDiamond(r: number, h: number): THREE.BufferGeometry {
  return buildRoundBrilliant(r, h, 24, 0.42); // very elongated ellipse
}

// ── Main component ────────────────────────────────────────────────────────────
interface Ring3DViewerProps {
  metal?: string;
  diamondShape?: string;
  caratWeight?: number;
  className?: string;
}

export default function Ring3DViewer({
  metal = 'platinum',
  diamondShape = 'round',
  caratWeight = 1.0,
  className = '',
}: Ring3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef  = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    band: THREE.Mesh;
    diamond: THREE.Mesh;
    prongs: THREE.Group;
    animId: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    rotX: number;
    rotY: number;
    zoom: number;
  } | null>(null);

  // ── Scene setup ─────────────────────────────────────────────────────────────
  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.clientWidth  || 560;
    const h = canvas.clientHeight || 420;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f6);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 100);
    camera.position.set(0, 0.3, 1.6);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff0e8, 2.2);
    key.position.set(2, 3, 2);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe8f0ff, 1.0);
    fill.position.set(-2, 1, -1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, -2, -2);
    scene.add(rim);

    // ── Band ────────────────────────────────────────────────────────────────
    const preset = METAL_PRESETS[metal?.toLowerCase()] ?? METAL_PRESETS.platinum;
    const bandMat = new THREE.MeshStandardMaterial({
      color: preset.color,
      metalness: preset.metalness,
      roughness: preset.roughness,
      envMapIntensity: 2.0,
    });

    // Torus: ring shape
    const bandGeom = new THREE.TorusGeometry(0.48, 0.065, 32, 160);
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.rotation.x = Math.PI / 2;
    band.castShadow = true;
    scene.add(band);

    // ── Setting head (basket) ──────────────────────────────────────────────
    // Small platform on top of the band
    const headGeom = new THREE.CylinderGeometry(0.14, 0.17, 0.12, 6);
    const head = new THREE.Mesh(headGeom, bandMat);
    head.position.set(0, 0.525, 0);
    scene.add(head);

    // ── Prongs ─────────────────────────────────────────────────────────────
    const prongs = new THREE.Group();
    const prongMat = new THREE.MeshStandardMaterial({
      color: preset.color,
      metalness: preset.metalness,
      roughness: preset.roughness,
    });
    const prongGeom = new THREE.CylinderGeometry(0.018, 0.013, 0.20, 8);
    const prongCount = diamondShape?.toLowerCase() === 'princess' ? 4 : 6;
    for (let i = 0; i < prongCount; i++) {
      const angle = (i / prongCount) * Math.PI * 2 + Math.PI / prongCount;
      const prongRadius = 0.17;
      const prong = new THREE.Mesh(prongGeom, prongMat);
      prong.position.set(
        Math.cos(angle) * prongRadius,
        0.60,
        Math.sin(angle) * prongRadius
      );
      prong.rotation.z = Math.cos(angle) * 0.22;
      prong.rotation.x = -Math.sin(angle) * 0.22;
      prongs.add(prong);
    }
    scene.add(prongs);

    // ── Diamond ────────────────────────────────────────────────────────────
    const diamondMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.02,
      transmission: 0.92,     // glass-like transparency
      thickness: 0.5,
      ior: 2.42,               // diamond IOR
      reflectivity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const diamGeom = buildDiamondGeometry(diamondShape || 'round', caratWeight || 1.0);
    const diamond = new THREE.Mesh(diamGeom, diamondMat);
    diamond.position.set(0, 0.72, 0);
    diamond.castShadow = true;
    scene.add(diamond);

    // ── Ground shadow plane ──────────────────────────────────────────────
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.52;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ── Orbit state ─────────────────────────────────────────────────────
    const state = {
      renderer, scene, camera, band, diamond, prongs,
      animId: 0,
      isDragging: false,
      lastX: 0, lastY: 0,
      rotX: 0.3, rotY: 0,
      zoom: 1.0,
    };
    sceneRef.current = state;

    // ── Animation loop ──────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);
    group.add(band);
    group.add(head);
    group.add(prongs);
    group.add(diamond);

    // remove individually added objects (now in group)
    scene.remove(band);
    scene.remove(head as unknown as THREE.Object3D);
    scene.remove(prongs);
    scene.remove(diamond);

    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      // Auto-rotate when not dragging
      if (!state.isDragging) {
        state.rotY += 0.003;
      }
      group.rotation.y = state.rotY;
      group.rotation.x = state.rotX;

      // Zoom via camera Z
      camera.position.z = 1.6 / state.zoom;

      renderer.render(scene, camera);
    };
    animate();

    // ── Pointer events ──────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.rotY += dx * 0.012;
      state.rotX += dy * 0.010;
      state.rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, state.rotX));
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerUp = () => { state.isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.zoom = Math.max(0.5, Math.min(3.0, state.zoom - e.deltaY * 0.001));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Touch pinch zoom
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.hypot(dx, dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        state.zoom = Math.max(0.5, Math.min(3.0, state.zoom * (dist / lastPinchDist)));
        lastPinchDist = dist;
      }
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    // Resize
    const onResize = () => {
      const w2 = canvas.clientWidth, h2 = canvas.clientHeight;
      if (w2 === 0 || h2 === 0) return;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(state.animId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      ro.disconnect();
      renderer.dispose();
    };
  }, []); // run only once

  // ── Update material when metal changes ──────────────────────────────────────
  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc) return;
    const preset = METAL_PRESETS[metal?.toLowerCase()] ?? METAL_PRESETS.platinum;
    const mat = sc.band.material as THREE.MeshStandardMaterial;
    mat.color.setHex(preset.color);
    mat.metalness  = preset.metalness;
    mat.roughness  = preset.roughness;
    mat.needsUpdate = true;

    // Also update prongs
    sc.prongs.children.forEach(p => {
      const pm = (p as THREE.Mesh).material as THREE.MeshStandardMaterial;
      pm.color.setHex(preset.color);
      pm.metalness  = preset.metalness;
      pm.roughness  = preset.roughness;
      pm.needsUpdate = true;
    });
  }, [metal]);

  // ── Update diamond geometry when shape/carat changes ───────────────────────
  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc) return;
    const newGeom = buildDiamondGeometry(diamondShape || 'round', caratWeight || 1.0);
    sc.diamond.geometry.dispose();
    sc.diamond.geometry = newGeom;
  }, [diamondShape, caratWeight]);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = init();
    return () => { cleanup?.(); };
  }, [init]);

  // ── Preset view buttons ─────────────────────────────────────────────────────
  const setView = (x: number, y: number) => {
    const sc = sceneRef.current;
    if (!sc) return;
    sc.rotX = x;
    sc.rotY = y;
  };

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: 380 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ height: 380, cursor: 'grab', touchAction: 'none' }}
      />

      {/* View preset buttons */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 border border-gray-200 rounded-sm px-2 py-1 shadow-sm">
        {[
          { label: 'Front',  x: 0,    y: 0 },
          { label: 'Side',   x: 0,    y: Math.PI / 2 },
          { label: 'Top',    x: -Math.PI / 2, y: 0 },
          { label: '45°',    x: 0.45, y: 0.7 },
        ].map(v => (
          <button
            key={v.label}
            onClick={() => setView(v.x, v.y)}
            className="px-2 py-0.5 text-[10px] font-sans text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      <div className="absolute top-3 right-3 text-[10px] font-sans text-gray-400 pointer-events-none select-none flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
        </svg>
        Drag to rotate
      </div>
    </div>
  );
}
