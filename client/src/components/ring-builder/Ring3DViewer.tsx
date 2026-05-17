'use client';

/**
 * Ring3DViewer
 *
 * PRIMARY PATH  — real GLB model (product.model3dUrl from Meshy.ai / jewelry CAD)
 *   GLTFLoader loads the file, our PBR materials are applied per mesh name.
 *   Metal colour / diamond shape changes update the shared materials instantly.
 *
 * FALLBACK PATH — procedural geometry when no model URL is supplied.
 *   Gives a rough representation; cannot match real ring detail.
 *
 * Post-processing: UnrealBloomPass makes diamond highlights blaze.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment }   from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader }        from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer }    from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }        from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass }   from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }        from 'three/examples/jsm/postprocessing/OutputPass.js';

// ─── Ring geometry constants (procedural fallback) ────────────────────────────
const RING_R  = 0.480;
const HEAD_Y  = 0.700;
const BASKET_Y = 0.520;

// ─── Metal presets ────────────────────────────────────────────────────────────
const PRESETS: Record<string, { color: number; metalness: number; roughness: number; envMapIntensity: number; clearcoat: number }> = {
  platinum:           { color: 0xe0e5f0, metalness: 0.98, roughness: 0.016, envMapIntensity: 1.8, clearcoat: 0.50 },
  'white-gold':       { color: 0xdce2ec, metalness: 0.96, roughness: 0.020, envMapIntensity: 1.7, clearcoat: 0.42 },
  'yellow-gold':      { color: 0xd4a018, metalness: 0.96, roughness: 0.018, envMapIntensity: 1.8, clearcoat: 0.45 },
  'rose-gold':        { color: 0xc85848, metalness: 0.93, roughness: 0.022, envMapIntensity: 1.6, clearcoat: 0.35 },
  silver:             { color: 0xc8ccd8, metalness: 0.92, roughness: 0.025, envMapIntensity: 1.6, clearcoat: 0.30 },
  '18ct white gold':  { color: 0xdce2ec, metalness: 0.96, roughness: 0.020, envMapIntensity: 1.7, clearcoat: 0.42 },
  '18ct yellow gold': { color: 0xd4a018, metalness: 0.96, roughness: 0.018, envMapIntensity: 1.8, clearcoat: 0.45 },
  '18ct rose gold':   { color: 0xc85848, metalness: 0.93, roughness: 0.022, envMapIntensity: 1.6, clearcoat: 0.35 },
  '9ct yellow gold':  { color: 0xc89420, metalness: 0.88, roughness: 0.030, envMapIntensity: 1.5, clearcoat: 0.30 },
  '9ct white gold':   { color: 0xd0d4de, metalness: 0.88, roughness: 0.030, envMapIntensity: 1.5, clearcoat: 0.30 },
  '9ct rose gold':    { color: 0xbd5040, metalness: 0.88, roughness: 0.032, envMapIntensity: 1.4, clearcoat: 0.28 },
};
const getPreset = (m?: string) => PRESETS[(m || '').toLowerCase()] ?? PRESETS['platinum'];

// ─── Clean studio background (neutral warm white, like Blue Nile) ─────────────
function makeStudioBG(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#f4f4f4');
  g.addColorStop(0.5, '#eeecea');
  g.addColorStop(1.0, '#e5e2de');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  return new THREE.CanvasTexture(c);
}


// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL FALLBACK GEOMETRY
// All rings lie in the XY plane (hole axis = Z, faces camera).
// Diamond / head at 12 o'clock: (0, HEAD_Y, 0)
// ─────────────────────────────────────────────────────────────────────────────

function buildCourtBand(ringR = RING_R, bandW = 0.060, domeH = 0.048, segments = 128, profilePts = 20): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= profilePts; i++) {
    const t = i / profilePts, z = (t - 0.5) * bandW * 2, rad = domeH * Math.sin(t * Math.PI) * 1.4;
    profile.push(new THREE.Vector2(rad, z));
  }
  const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idx: number[] = [];
  for (let s = 0; s <= segments; s++) {
    const θ = (s / segments) * Math.PI * 2, cT = Math.cos(θ), sT = Math.sin(θ);
    for (let p = 0; p <= profilePts; p++) {
      const { x: rad, y: z } = profile[p]; const r = ringR + rad;
      verts.push(cT * r, sT * r, z);
      const pv = profile[Math.max(0, p - 1)], nx = profile[Math.min(profilePts, p + 1)];
      const dr = nx.x - pv.x, dz = nx.y - pv.y, nxr = dz, nzr = -dr, len = Math.sqrt(nxr*nxr+nzr*nzr)||1;
      norms.push(cT*(nxr/len), sT*(nxr/len), nzr/len); uvs.push(s/segments, p/profilePts);
    }
  }
  const row = profilePts + 1;
  for (let s = 0; s < segments; s++) for (let p = 0; p < profilePts; p++) { const a=s*row+p,b=a+1,c=(s+1)*row+p,d=c+1; idx.push(a,c,b,b,c,d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));
  g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,   2));
  g.setIndex(idx); return g;
}

function buildKnifeBand(ringR = RING_R, bandW = 0.060, ridgeH = 0.052, seg = 128): THREE.BufferGeometry {
  const pts = 16;
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= pts; i++) { const t=i/pts,z=(t-0.5)*bandW*2,rad=ridgeH*(1-Math.abs(t*2-1)**1.4); profile.push(new THREE.Vector2(rad,z)); }
  const verts:number[]=[],norms:number[]=[],uvs:number[]=[],idx:number[]=[];
  for (let s=0;s<=seg;s++) { const θ=(s/seg)*Math.PI*2,cT=Math.cos(θ),sT=Math.sin(θ);
    for (let p=0;p<=pts;p++) { const{x:rad,y:z}=profile[p],r=ringR+rad; verts.push(cT*r,sT*r,z);
      const pv=profile[Math.max(0,p-1)],nx2=profile[Math.min(pts,p+1)],dr=nx2.x-pv.x,dz=nx2.y-pv.y,nxr=dz,nzr=-dr,len=Math.sqrt(nxr*nxr+nzr*nzr)||1;
      norms.push(cT*(nxr/len),sT*(nxr/len),nzr/len); uvs.push(s/seg,p/pts); } }
  const row=pts+1;
  for(let s=0;s<seg;s++) for(let p=0;p<pts;p++){const a=s*row+p,b=a+1,c=(s+1)*row+p,d=c+1;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); g.setIndex(idx); return g;
}

function buildTwistedBand(ringR=RING_R,bandW=0.052,seg=180):THREE.BufferGeometry{
  const tw=1.5,pts=14,verts:number[]=[],norms:number[]=[],idx:number[]=[];
  for(let s=0;s<=seg;s++){const θ=(s/seg)*Math.PI*2,roll=(s/seg)*Math.PI*2*tw,cT=Math.cos(θ),sT=Math.sin(θ),cR=Math.cos(roll),sR=Math.sin(roll);
    for(let p=0;p<=pts;p++){const a=(p/pts)*Math.PI*2,pr=bandW*0.65*Math.cos(a),pa=bandW*0.30*Math.sin(a),rad=pr*cR-pa*sR,ax=pr*sR+pa*cR,r=ringR+rad;
      verts.push(cT*r,sT*r,ax); norms.push(cT*cR,sT*cR,sR);}}
  const row=pts+1;
  for(let s=0;s<seg;s++) for(let p=0;p<pts;p++){const a=s*row+p,b=a+1,c=(s+1)*row+p,d=c+1;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3)); g.setIndex(idx); return g;
}

function buildProng(phi:number,mat:THREE.MeshPhysicalMaterial,dY=HEAD_Y,pR=0.148):THREE.Group{
  const g=new THREE.Group(),cP=Math.cos(phi),sP=Math.sin(phi),gird=dY-0.012;
  const p0=new THREE.Vector3(cP*pR*0.78,BASKET_Y+0.04,sP*pR*0.78);
  const p1=new THREE.Vector3(cP*pR*0.92,BASKET_Y+0.24,sP*pR*0.92);
  const p2=new THREE.Vector3(cP*pR*1.08,gird-0.04,sP*pR*1.08);
  const p3=new THREE.Vector3(cP*pR*0.90,gird+0.062,sP*pR*0.90);
  const curve=new THREE.CubicBezierCurve3(p0,p1,p2,p3);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,14,0.013,8,false),mat));
  const tip=new THREE.Mesh(new THREE.SphereGeometry(0.017,8,6),mat); tip.position.copy(p3); g.add(tip);
  return g;
}

function buildGalleryWires(mat:THREE.MeshPhysicalMaterial,n:4|6,pR=0.148):THREE.Group{
  const g=new THREE.Group(),baseY=BASKET_Y+0.08;
  for(let i=0;i<n;i++){
    const phi1=(i/n)*Math.PI*2+Math.PI/n,phi2=((i+1)/n)*Math.PI*2+Math.PI/n,mid=(phi1+phi2)/2;
    const p0=new THREE.Vector3(Math.cos(phi1)*pR,baseY,Math.sin(phi1)*pR);
    const pm=new THREE.Vector3(Math.cos(mid)*pR*0.74,baseY-0.036,Math.sin(mid)*pR*0.74);
    const p2=new THREE.Vector3(Math.cos(phi2)*pR,baseY,Math.sin(phi2)*pR);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0,pm,p2),10,0.0072,6,false),mat));
  }
  return g;
}

function buildHead(mat:THREE.MeshPhysicalMaterial,headStyle:string,pc:4|6):THREE.Group{
  const g=new THREE.Group(),isHalo=headStyle.includes('halo'),isBezel=headStyle==='bezel';
  const shRing=new THREE.Mesh(new THREE.TorusGeometry(RING_R+0.008,0.014,10,64),mat);
  shRing.rotation.x=Math.PI/2; shRing.position.y=BASKET_Y; g.add(shRing);
  if(isBezel){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.162,0.140,0.095,32,1,true),mat); col.position.y=HEAD_Y-0.005; g.add(col);
    const rt=new THREE.Mesh(new THREE.TorusGeometry(0.162,0.012,8,48),mat); rt.rotation.x=Math.PI/2; rt.position.y=HEAD_Y+0.044; g.add(rt);
    const rb=new THREE.Mesh(new THREE.TorusGeometry(0.140,0.010,8,48),mat); rb.rotation.x=Math.PI/2; rb.position.y=HEAD_Y-0.055; g.add(rb);
  } else {
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.108,0.142,0.155,pc*2,2,true),mat); cup.position.y=BASKET_Y+0.078; g.add(cup);
    const gRing=new THREE.Mesh(new THREE.TorusGeometry(0.140,0.011,8,48),mat); gRing.rotation.x=Math.PI/2; gRing.position.y=BASKET_Y+0.015; g.add(gRing);
    // Girdle seat
    const seat=new THREE.Mesh(new THREE.TorusGeometry(0.122,0.0095,8,48),mat); seat.rotation.x=Math.PI/2; seat.position.y=HEAD_Y-0.018; g.add(seat);
    if(!isHalo){
      g.add(buildGalleryWires(mat,pc));
      for(let i=0;i<pc;i++) g.add(buildProng((i/pc)*Math.PI*2+Math.PI/pc,mat));
    }
    // Milgrain
    const bGeom=new THREE.SphereGeometry(0.0058,5,4);
    for(let i=0;i<48;i++){const φ=(i/48)*Math.PI*2,b=new THREE.Mesh(bGeom,mat); b.position.set(Math.cos(φ)*0.145,BASKET_Y+0.010,Math.sin(φ)*0.145); g.add(b);}
  }
  return g;
}

function buildHalo(mat:THREE.MeshPhysicalMaterial,dMat:THREE.MeshPhysicalMaterial,dual=false):THREE.Group{
  const g=new THREE.Group();
  for(let ring=0;ring<(dual?2:1);ring++){
    const hR=0.240+ring*0.050,n=20-ring*4;
    const sGeom=buildRoundBrill(0.019,0.022,10,1.0); sGeom.computeVertexNormals();
    for(let i=0;i<n;i++){const phi=(i/n)*Math.PI*2,s=new THREE.Mesh(sGeom,dMat); s.position.set(Math.cos(phi)*hR,HEAD_Y,Math.sin(phi)*hR); s.rotation.x=Math.PI/2; g.add(s);}
    const hRing=new THREE.Mesh(new THREE.TorusGeometry(hR,0.011,8,64),mat); hRing.rotation.x=Math.PI/2; hRing.position.y=HEAD_Y; g.add(hRing);
    for(let i=0;i<4;i++) g.add(buildProng((i/4)*Math.PI*2+Math.PI/4,mat));
    const seat=new THREE.Mesh(new THREE.TorusGeometry(0.122,0.0095,8,48),mat); seat.rotation.x=Math.PI/2; seat.position.y=HEAD_Y-0.018; g.add(seat);
  }
  return g;
}

function buildPaveBand(mat:THREE.MeshPhysicalMaterial,dMat:THREE.MeshPhysicalMaterial,half=false):THREE.Group{
  const g=new THREE.Group(),arcDeg=half?160:295,startA=Math.PI/2+((360-arcDeg)/360)*Math.PI,rows=half?1:2;
  const sGeom=new THREE.OctahedronGeometry(0.012,0);
  for(let row=-rows;row<=rows;row++){if(rows>1&&row===0)continue;
    const zOff=row*0.038,n=Math.round(arcDeg/13);
    for(let i=0;i<n;i++){const θ=startA+(i/(n-1))*(arcDeg*Math.PI/180),r=RING_R+0.054;
      const s=new THREE.Mesh(sGeom,dMat); s.position.set(Math.cos(θ)*r,Math.sin(θ)*r,zOff); s.lookAt(Math.cos(θ)*(r+1),Math.sin(θ)*(r+1),zOff); g.add(s);}}
  return g;
}

function buildChannel(mat:THREE.MeshPhysicalMaterial,dMat:THREE.MeshPhysicalMaterial):THREE.Group{
  const g=new THREE.Group();
  for(const zo of[-0.040,0.040]){const r=new THREE.Mesh(new THREE.TorusGeometry(RING_R+0.056,0.009,6,80),mat); r.rotation.x=Math.PI/2; r.position.z=zo; g.add(r);}
  const sGeom=buildSqDiamond(0.016,0.018); sGeom.computeVertexNormals();
  for(let i=0;i<18;i++){const θ=Math.PI/2+((i+0.5)/18)*Math.PI*(285/180),r=RING_R+0.056;
    const s=new THREE.Mesh(sGeom,dMat); s.position.set(Math.cos(θ)*r,Math.sin(θ)*r,0); s.lookAt(Math.cos(θ)*(r+1),Math.sin(θ)*(r+1),0); g.add(s);}
  return g;
}

function buildThreeStone(mat:THREE.MeshPhysicalMaterial,dMat:THREE.MeshPhysicalMaterial,shape:string,carat:number):THREE.Group{
  const g=new THREE.Group(),sideGeom=buildDiamondGeom('oval',carat*0.35,1);
  for(const[xOff,yOff] of[[-0.310,HEAD_Y-0.058],[0.310,HEAD_Y-0.058]] as[number,number][]){
    const s=new THREE.Mesh(sideGeom,dMat); s.position.set(xOff,yOff,0); g.add(s);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.080,0.085,8,1,true),mat); cup.position.set(xOff,yOff-0.042,0); g.add(cup);
    const seat=new THREE.Mesh(new THREE.TorusGeometry(0.070,0.008,6,32),mat); seat.rotation.x=Math.PI/2; seat.position.set(xOff,yOff-0.018,0); g.add(seat);
    for(let i=0;i<4;i++){const prong=buildProng((i/4)*Math.PI*2,mat,yOff,0.080); prong.position.x+=xOff; g.add(prong);}
  }
  const cGeom=buildDiamondGeom(shape,carat,1); const c=new THREE.Mesh(cGeom,dMat); c.position.set(0,HEAD_Y,0); g.add(c);
  return g;
}

function buildEternity(mat:THREE.MeshPhysicalMaterial,dMat:THREE.MeshPhysicalMaterial):THREE.Group{
  const g=new THREE.Group(),sGeom=buildRoundBrill(0.029,0.034,12,1.0); sGeom.computeVertexNormals();
  for(let i=0;i<18;i++){const θ=(i/18)*Math.PI*2,r=RING_R+0.042;
    const s=new THREE.Mesh(sGeom,dMat); s.position.set(Math.cos(θ)*r,Math.sin(θ)*r,0); s.rotation.z=θ; g.add(s);}
  return g;
}

// Diamond geometry (table at +Y, culet at -Y)
function buildDiamondGeom(shape:string,cs=1,sf=1):THREE.BufferGeometry{
  const s=(shape||'round').toLowerCase(),r=0.168*Math.cbrt(cs)*sf,h=r*1.12;
  let geom:THREE.BufferGeometry;
  if(s==='round')                                      geom=buildRoundBrill(r,h,32,1.00);
  else if(s==='oval')                                  geom=buildRoundBrill(r,h,24,0.68);
  else if(s==='princess'||s==='cushion'||s==='asscher')geom=buildSqDiamond(r,h);
  else if(s==='emerald'||s==='radiant')                geom=buildRectDiamond(r*1.22,r*0.82,h);
  else if(s==='pear')                                  geom=buildPearDiamond(r,h);
  else if(s==='marquise')                              geom=buildRoundBrill(r,h,24,0.42);
  else if(s==='heart')                                 geom=buildHeartDiamond(r,h);
  else                                                 geom=buildRoundBrill(r,h,32,1.00);
  geom.computeVertexNormals(); return geom;
}
// Round brilliant with proper 8-fold symmetry:
//   Crown  — table (octagon) + 8 star facets + 8 bezel (kite) facets
//   Girdle — thin band at equator
//   Pavilion — 8 main facets + 8 lower-half facets → culet
// This produces the characteristic 8-point star caustic visible from above.
function buildRoundBrill(r: number, h: number, _segs: number, xS: number): THREE.BufferGeometry {
  const N  = 8;
  const tR = r * 0.53 * xS;   // table radius  (53% GIA ideal)
  const tY = h * 0.162;        // table elevation
  const gY = 0.0;              // girdle plane
  const pY = -h * 0.740;       // culet depth
  const PI2 = Math.PI * 2;

  const verts: number[] = [];
  const addV = (x: number, y: number, z: number) => { verts.push(x, y, z); return verts.length / 3 - 1; };

  // ── Crown vertices ────────────────────────────────────────────────────────
  const vTableC = addV(0, tY, 0);
  // Table octagon — vertices at 0°, 45°, … (aligned with bezel facets)
  const vTable = Array.from({length: N}, (_, i) => {
    const a = (i / N) * PI2;
    return addV(tR * Math.cos(a), tY, tR * Math.sin(a));
  });
  // Star facet tips — offset by half-step, at 72% girdle radius, just below table
  const vStar = Array.from({length: N}, (_, i) => {
    const a = ((i + 0.5) / N) * PI2;
    return addV(r * xS * 0.72 * Math.cos(a), tY * 0.18, r * 0.72 * Math.sin(a));
  });
  // Girdle octagon — vertices at same angles as table
  const vGirdle = Array.from({length: N}, (_, i) => {
    const a = (i / N) * PI2;
    return addV(r * xS * Math.cos(a), gY, r * Math.sin(a));
  });
  // Girdle octagon — vertices at star angles (between above)
  const vGirdleB = Array.from({length: N}, (_, i) => {
    const a = ((i + 0.5) / N) * PI2;
    return addV(r * xS * Math.cos(a), gY, r * Math.sin(a));
  });

  // ── Pavilion vertices ─────────────────────────────────────────────────────
  // Lower-half facet tips — same angles as star, at 42% radius, halfway to culet
  const vPavStar = Array.from({length: N}, (_, i) => {
    const a = ((i + 0.5) / N) * PI2;
    return addV(r * xS * 0.42 * Math.cos(a), pY * 0.52, r * 0.42 * Math.sin(a));
  });
  const vCulet = addV(0, pY, 0);

  const ix: number[] = [];
  const tri = (a: number, b: number, c: number) => ix.push(a, b, c);

  for (let i = 0; i < N; i++) {
    const n = (i + 1) % N;
    // ── Table: 8 triangles from centre to octagon edge ────────────────────
    tri(vTableC, vTable[i], vTable[n]);
    // ── Star facets: small triangles between table corners ────────────────
    tri(vTable[n], vStar[i], vTable[i]);   // pointing inward from table[n]
    // ── Bezel (kite) facets: table→star→girdle (split into 2 tris) ────────
    tri(vTable[i], vStar[i], vGirdle[i]);
    tri(vStar[i],  vGirdleB[i], vGirdle[i]);
    tri(vTable[n], vGirdleB[i], vStar[i]);
    // ── Pavilion main facets ──────────────────────────────────────────────
    tri(vGirdle[i],  vGirdleB[i], vPavStar[i]);
    tri(vGirdleB[i], vGirdle[n],  vPavStar[i]);
    // ── Lower-half facets → culet ─────────────────────────────────────────
    tri(vGirdle[i],  vPavStar[i], vCulet);
    tri(vPavStar[i], vGirdle[n],  vCulet);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(ix);
  // No computeVertexNormals — keep flat per-face normals so each facet
  // reflects light independently, exactly like a real cut diamond.
  return geo;
}
function buildSqDiamond(r:number,h:number):THREE.BufferGeometry{
  const tR=r*0.52,tY=h*0.18,cY=h*0.28,pY=-h*0.72,sq:[number,number][]=[[-r,-r],[r,-r],[r,r],[-r,r]],sqT:[number,number][]=[[-tR,-tR],[tR,-tR],[tR,tR],[-tR,tR]];
  const p:number[]=[0,tY,0];sqT.forEach(([x,z])=>p.push(x,tY,z));sq.forEach(([x,z])=>p.push(x,cY,z));sq.forEach(([x,z])=>p.push(x,0,z));p.push(0,pY,0);
  const ix:number[]=[];ix.push(0,1,2,0,2,3,0,3,4,0,4,1);
  for(let i=0;i<4;i++){const a0=1+i,a1=1+(i+1)%4,b0=5+i,b1=5+(i+1)%4;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<4;i++){const a0=5+i,a1=5+(i+1)%4,b0=9+i,b1=9+(i+1)%4;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<4;i++){const a=9+i,b=9+(i+1)%4;ix.push(a,13,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);return g;
}
function buildRectDiamond(rw:number,rh:number,h:number):THREE.BufferGeometry{
  const tY=h*0.18,cY=h*0.28,pY=-h*0.72,tw=rw*0.52,th=rh*0.52;
  const p=[0,tY,0,-tw,tY,-th,tw,tY,-th,tw,tY,th,-tw,tY,th,-rw,cY,-rh,rw,cY,-rh,rw,cY,rh,-rw,cY,rh,-rw,0,-rh,rw,0,-rh,rw,0,rh,-rw,0,rh,0,pY,0];
  const ix=[0,1,2,0,2,3,0,3,4,0,4,1,1,5,2,2,5,6,2,6,3,3,6,7,3,7,4,4,7,8,4,8,1,1,8,5,5,9,6,6,9,10,6,10,7,7,10,11,7,11,8,8,11,12,8,12,5,5,12,9,9,13,10,10,13,11,11,13,12,12,13,9];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);return g;
}
function buildPearDiamond(r:number,h:number):THREE.BufferGeometry{
  const segs=24,tY=h*0.18,cY=h*0.28,pY=-h*0.72,tR=r*0.45,p:number[]=[0,tY,0];
  for(let i=0;i<segs;i++){const a=(i/segs)*Math.PI*2,o=-r*0.25*Math.sin(a);p.push(tR*Math.cos(a)*0.82,tY,tR*Math.sin(a)+o*0.4);}
  for(let i=0;i<segs;i++){const a=(i/segs)*Math.PI*2,o=-r*0.3*Math.sin(a);p.push(r*Math.cos(a)*0.82,cY,r*Math.sin(a)+o*0.5);}
  for(let i=0;i<segs;i++){const a=(i/segs)*Math.PI*2,o=-r*0.3*Math.sin(a);p.push(r*Math.cos(a)*0.82,0,r*Math.sin(a)+o*0.5);}
  const cu=1+segs*3;p.push(0,pY,0);const ix:number[]=[];
  for(let i=0;i<segs;i++)ix.push(0,1+i,1+(i+1)%segs);
  for(let i=0;i<segs;i++){const a0=1+i,a1=1+(i+1)%segs,b0=1+segs+i,b1=1+segs+(i+1)%segs;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<segs;i++){const a0=1+segs+i,a1=1+segs+(i+1)%segs,b0=1+segs*2+i,b1=1+segs*2+(i+1)%segs;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<segs;i++)ix.push(1+segs*2+i,cu,1+segs*2+(i+1)%segs);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);return g;
}
function buildHeartDiamond(r:number,h:number):THREE.BufferGeometry{
  const segs=28,tY=h*0.18,cY=h*0.28,pY=-h*0.72,hp=(t:number,sc:number):[number,number]=>{const a=t*Math.PI*2;return[sc*(16*Math.sin(a)**3)/16*r,-sc*(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/16*r];};
  const p:number[]=[0,tY,0];
  for(let i=0;i<segs;i++){const[x,z]=hp(i/segs,0.52);p.push(x,tY,z);}
  for(let i=0;i<segs;i++){const[x,z]=hp(i/segs,1.0);p.push(x,cY,z);}
  for(let i=0;i<segs;i++){const[x,z]=hp(i/segs,1.0);p.push(x,0,z);}
  const cu=1+segs*3;p.push(0,pY,0);const ix:number[]=[];
  for(let i=0;i<segs;i++)ix.push(0,1+i,1+(i+1)%segs);
  for(let i=0;i<segs;i++){const a0=1+i,a1=1+(i+1)%segs,b0=1+segs+i,b1=1+segs+(i+1)%segs;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<segs;i++){const a0=1+segs+i,a1=1+segs+(i+1)%segs,b0=1+segs*2+i,b1=1+segs*2+(i+1)%segs;ix.push(a0,b0,a1,a1,b0,b1);}
  for(let i=0;i<segs;i++)ix.push(1+segs*2+i,cu,1+segs*2+(i+1)%segs);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);return g;
}

function disposeGroup(g:THREE.Group){g.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry?.dispose();});g.clear();}

// ─── Public types ─────────────────────────────────────────────────────────────
export type SettingStyle = 'solitaire'|'halo'|'pave'|'three-stone'|'eternity'|'vintage'|'twist';

interface Ring3DViewerProps {
  modelUrl?:     string;   // real GLB from Meshy.ai / jewelry CAD → primary path
  metal?:        string;
  diamondShape?: string;
  caratWeight?:  number;
  headStyle?:    string;
  bandStyle?:    string;
  className?:    string;
}

interface SceneState {
  renderer:      THREE.WebGLRenderer;
  scene:         THREE.Scene;
  camera:        THREE.PerspectiveCamera;
  composer:      EffectComposer;
  bloom:         UnrealBloomPass;
  keyLight:      THREE.DirectionalLight;
  fillLight:     THREE.DirectionalLight;
  crownLight:    THREE.DirectionalLight;
  group:         THREE.Group;
  ringParts:     THREE.Group;
  metalMat:      THREE.MeshPhysicalMaterial;
  diamondMat:    THREE.MeshPhysicalMaterial;
  centreDiamond: THREE.Mesh | null;
  sparkleL1:     THREE.PointLight;
  sparkleL2:     THREE.PointLight;
  sparkleAngle:  number;
  animId:        number;
  isDragging:    boolean;
  lastX:number;  lastY:number;
  rotX:number;   rotY:number;
  zoom:number;
}

// Diamond-like regex for auto-assigning materials to loaded GLB meshes
const DIAMOND_NAME = /diamond|stone|gem|brilliant|crystal|girdle|pavilion|crown/i;

// Meshy GLBs are on CloudFront with no CORS headers — proxy through our server.
// Use the same API base URL that all other requests use (NEXT_PUBLIC_API_URL).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

function resolveGlbUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/') || url.includes(window.location.hostname)) return url;
  return `${API_BASE}/glb-proxy?url=${encodeURIComponent(url)}`;
}

export default function Ring3DViewer({
  modelUrl,
  metal        = 'platinum',
  diamondShape = 'round',
  caratWeight  = 1.0,
  headStyle    = 'four-claw',
  bandStyle    = 'plain',
  className    = '',
}: Ring3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef  = useRef<SceneState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usingModel, setUsingModel] = useState(false);

  // Always-fresh prop refs
  const metalRef = useRef(metal); const shapeRef = useRef(diamondShape);
  const caratRef = useRef(caratWeight); const headRef = useRef(headStyle); const bandRef = useRef(bandStyle);
  metalRef.current = metal; shapeRef.current = diamondShape;
  caratRef.current = caratWeight; headRef.current = headStyle; bandRef.current = bandStyle;

  // ─── Build procedural ring parts ────────────────────────────────────────
  const buildProceduralParts = useCallback((
    metalMat: THREE.MeshPhysicalMaterial,
    diamondMat: THREE.MeshPhysicalMaterial,
  ): { parts: THREE.Group; centreDiamond: THREE.Mesh | null } => {
    const head  = headRef.current || 'four-claw';
    const band  = bandRef.current || 'plain';
    const shape = shapeRef.current || 'round';
    const carat = caratRef.current || 1.0;
    const parts = new THREE.Group();
    const isHalo = head.includes('halo');
    const pc: 4|6 = (shape==='princess'||shape==='asscher') ? 4 : (head==='six-claw' ? 6 : 4);

    // Band
    if      (band==='twisted')    parts.add(new THREE.Mesh(buildTwistedBand(), metalMat));
    else if (band==='knife-edge') parts.add(new THREE.Mesh(buildKnifeBand(),   metalMat));
    else if (band==='eternity')   parts.add(new THREE.Mesh(buildCourtBand(RING_R,0.080,0.040), metalMat));
    else                          parts.add(new THREE.Mesh(buildCourtBand(), metalMat));

    // Band decoration
    if (band==='eternity')   { parts.add(buildEternity(metalMat,diamondMat)); return {parts,centreDiamond:null}; }
    if (band==='three-stone'){ const g=buildThreeStone(metalMat,diamondMat,shape,carat); parts.add(g);
      const c=g.children.find(ch=>ch instanceof THREE.Mesh&&Math.abs((ch as THREE.Mesh).position.y-HEAD_Y)<0.01) as THREE.Mesh|undefined;
      return {parts,centreDiamond:c??null}; }
    if (band==='pave')       parts.add(buildPaveBand(metalMat,diamondMat,false));
    else if(band==='half-pave') parts.add(buildPaveBand(metalMat,diamondMat,true));
    else if(band==='channel')   parts.add(buildChannel(metalMat,diamondMat));

    // Head
    parts.add(buildHead(metalMat,head,pc));
    if (isHalo) parts.add(buildHalo(metalMat,diamondMat,head==='dual-halo'));

    // Centre diamond
    const dGeom = buildDiamondGeom(shape,carat);
    const centreDiamond = new THREE.Mesh(dGeom,diamondMat);
    centreDiamond.position.set(0,HEAD_Y,0);
    parts.add(centreDiamond);
    return {parts,centreDiamond};
  }, []);

  // ─── Scene init (runs once) ──────────────────────────────────────────────
  const init = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = canvas.clientWidth||560, H = canvas.clientHeight||560;

    // Renderer — LinearSRGBColorSpace so OutputPass can handle gamma
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace    = THREE.LinearSRGBColorSpace;

    // Scene
    const scene = new THREE.Scene();
    scene.background = makeStudioBG();

    // RoomEnvironment: neutral white studio IBL — reliable across all WebGL contexts.
    // Bright warm overhead + soft fill gives gold its warmth and lets the
    // diamond material pick up the bright ceiling for table reflections.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Camera — slightly tighter FOV to feel more like a macro lens
    const camera = new THREE.PerspectiveCamera(30, W/H, 0.01, 100);
    camera.position.set(0, 0.52, 1.55); camera.lookAt(0, 0.36, 0);

    // ── Post-processing ───────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Bloom tuned for diamond fire: very high threshold so only specular
    // hotspots bloom — keeps metal clean while diamonds sparkle.
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.28, 0.90);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ── Lights ────────────────────────────────────────────────────────────
    // The HDR carries most of the IBL load. Physical lights add directional
    // shadow detail and animated sparkle that IBL alone can't provide.
    const key = new THREE.DirectionalLight(0xfff6e8, 0.55);
    key.position.set(1.5, 3.5, 2.2); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0008; scene.add(key);

    const fill = new THREE.DirectionalLight(0xd0e4ff, 0.18);
    fill.position.set(-2.2, 1.2, -0.8); scene.add(fill);

    const rim = new THREE.DirectionalLight(0xc8d8ff, 0.22);
    rim.position.set(0.0, 1.0, -2.2); scene.add(rim);

    const crown = new THREE.DirectionalLight(0xffffff, 0.28);
    crown.position.set(0.0, 3.0, 1.0); scene.add(crown);

    scene.add(new THREE.AmbientLight(0xfff4e8, 0.06));

    // Two orbiting point lights create animated diamond caustics / fire.
    // Positioned close to the stone so they cast tight specular highlights
    // that rotate as the ring spins — simulating studio light movement.
    const sparkleL1 = new THREE.PointLight(0xffffff, 1.8, 0.65);
    sparkleL1.position.set(0.4, HEAD_Y + 0.35, 0.30); scene.add(sparkleL1);
    const sparkleL2 = new THREE.PointLight(0xffe8c0, 1.1, 0.50);
    sparkleL2.position.set(-0.3, HEAD_Y + 0.28, 0.26); scene.add(sparkleL2);

    // Subtle ground shadow catcher
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.90, 64),
      new THREE.MeshPhysicalMaterial({ color: 0xeeecea, metalness: 0, roughness: 0.65, transparent: true, opacity: 0.60 }),
    );
    ground.rotation.x = -Math.PI / 2; ground.position.y = -(RING_R + 0.10); ground.receiveShadow = true;
    scene.add(ground);

    // ── Materials ─────────────────────────────────────────────────────────
    const preset = getPreset(metalRef.current);
    const metalMat = new THREE.MeshPhysicalMaterial({
      color: preset.color, metalness: preset.metalness, roughness: preset.roughness,
      envMapIntensity: preset.envMapIntensity, clearcoat: preset.clearcoat, clearcoatRoughness: 0.018,
    });

    // Diamond material — maxed for optical realism:
    //   transmission + ior  → light bends and refracts through the stone
    //   clearcoat           → mirror-sharp table reflection (the "bright" face)
    //   iridescence         → thin-film dispersion = rainbow fire on each facet
    //   high envMapIntensity → picks up every bright spot in the jewelry HDR
    const diamondMat = new THREE.MeshPhysicalMaterial({
      color:              0xffffff,
      metalness:          0,
      roughness:          0,
      transmission:       0.98,
      ior:                2.42,
      thickness:          0.45,
      clearcoat:          1.0,
      clearcoatRoughness: 0.0,
      reflectivity:       1.0,
      specularIntensity:  2.0,
      specularColor:      new THREE.Color(0xffffff),
      envMapIntensity:    7.0,
      attenuationColor:   new THREE.Color(0xeef2ff),
      attenuationDistance:0.30,
      iridescence:              0.28,
      iridescenceIOR:           2.42,
      iridescenceThicknessRange:[80, 320] as [number, number],
    });

    // ── Initial ring (procedural) — replaced if modelUrl present ─────────
    const group = new THREE.Group(); scene.add(group);
    const {parts,centreDiamond} = buildProceduralParts(metalMat,diamondMat);
    group.add(parts);

    const state: SceneState = {
      renderer, scene, camera, composer, bloom,
      keyLight: key, fillLight: fill, crownLight: crown,
      group,
      ringParts: parts, metalMat, diamondMat, centreDiamond,
      sparkleL1, sparkleL2, sparkleAngle: 0,
      animId: 0, isDragging: false,
      lastX:0, lastY:0, rotX:0.18, rotY:0, zoom:1.0,
    };
    sceneRef.current = state;

    // ── Animation loop ────────────────────────────────────────────────────
    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      if (!state.isDragging) state.rotY += 0.0020;
      group.rotation.y = state.rotY; group.rotation.x = state.rotX;
      camera.position.z = 1.62 / state.zoom;
      state.sparkleAngle += 0.018;
      const sA = state.sparkleAngle;
      state.sparkleL1.position.set(Math.cos(sA)*0.48,     HEAD_Y+0.40, Math.sin(sA)*0.36);
      state.sparkleL2.position.set(Math.cos(sA+2.2)*0.38, HEAD_Y+0.32, Math.sin(sA+2.2)*0.30);
      composer.render();
    };
    animate();

    // ── Controls ──────────────────────────────────────────────────────────
    const onDown=(e:PointerEvent)=>{state.isDragging=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
    const onMove=(e:PointerEvent)=>{if(!state.isDragging)return;state.rotY+=(e.clientX-state.lastX)*0.012;state.rotX=Math.max(-Math.PI/2,Math.min(Math.PI/2,state.rotX+(e.clientY-state.lastY)*0.010));state.lastX=e.clientX;state.lastY=e.clientY;};
    const onUp=()=>{state.isDragging=false;};
    const onWheel=(e:WheelEvent)=>{e.preventDefault();state.zoom=Math.max(0.5,Math.min(3.5,state.zoom-e.deltaY*0.001));};
    canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove);
    canvas.addEventListener('pointerup',onUp); canvas.addEventListener('wheel',onWheel,{passive:false});
    let lp=0;
    const onTS=(e:TouchEvent)=>{if(e.touches.length===2)lp=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);};
    const onTM=(e:TouchEvent)=>{if(e.touches.length!==2)return;e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);state.zoom=Math.max(0.5,Math.min(3.5,state.zoom*(d/lp)));lp=d;};
    canvas.addEventListener('touchstart',onTS,{passive:true}); canvas.addEventListener('touchmove',onTM,{passive:false});
    const ro=new ResizeObserver(()=>{const w2=canvas.clientWidth,h2=canvas.clientHeight;if(!w2||!h2)return;camera.aspect=w2/h2;camera.updateProjectionMatrix();renderer.setSize(w2,h2,false);composer.setSize(w2,h2);});
    ro.observe(canvas);
    return ()=>{cancelAnimationFrame(state.animId);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('touchstart',onTS);canvas.removeEventListener('touchmove',onTM);ro.disconnect();};
  }, [buildProceduralParts]);

  useEffect(()=>{const cleanup=init();return cleanup;},[init]);

  // ─── Load GLB model (or build procedural) when modelUrl changes ──────────
  useEffect(() => {
    const sc = sceneRef.current; if (!sc) return;
    let cancelled = false;

    // Clear current ring
    sc.group.remove(sc.ringParts); disposeGroup(sc.ringParts);
    sc.ringParts = new THREE.Group(); sc.centreDiamond = null;

    if (!modelUrl) {
      // No model → use procedural; restore default lighting
      sc.sparkleL1.intensity  = 1.6;
      sc.sparkleL2.intensity  = 0.9;
      sc.keyLight.intensity   = 0.75;
      sc.fillLight.intensity  = 0.22;
      sc.crownLight.intensity = 0.38;
      sc.bloom.strength       = 0.32;
      sc.bloom.threshold      = 0.90;
      sc.renderer.toneMappingExposure = 0.95;
      setUsingModel(false); setIsLoading(false);
      const {parts,centreDiamond} = buildProceduralParts(sc.metalMat,sc.diamondMat);
      sc.ringParts=parts; sc.centreDiamond=centreDiamond; sc.group.add(parts);
      return;
    }

    // Load real GLB — proxy through server to bypass Meshy CDN CORS restrictions
    setIsLoading(true); setUsingModel(true);
    const loader = new GLTFLoader();
    loader.load(
      resolveGlbUrl(modelUrl)!,
      (gltf) => {
        if (cancelled) return;
        const model = gltf.scene;
        // glTF exports from jewelry CAD use Y-up (hole axis = Y).
        // Our viewer expects hole axis = Z (facing camera), so rotate -90° around X.
        model.rotation.x = -Math.PI / 2;
        model.updateMatrixWorld(true);

        // Centre and scale model to fit our viewing volume
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const centre = box.getCenter(new THREE.Vector3());
        model.scale.setScalar(1.2 / size);
        model.position.sub(centre.multiplyScalar(1.2 / size));
        model.position.y += 0.05; // slight lift to match camera look-at

        model.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true; child.receiveShadow = true;
          if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();

          const origMat = Array.isArray(child.material) ? child.material[0] : child.material;
          const hasTexture = origMat instanceof THREE.MeshStandardMaterial && !!origMat.map;

          if (hasTexture) {
            // Upgrade MeshStandardMaterial → MeshPhysicalMaterial so we get:
            //   clearcoat  → crisp glass-like specular highlights on every facet
            //   iridescence → rainbow dispersion that reads as diamond fire
            // We copy the baked texture (which has gold + diamond colours) as the
            // albedo map so the original appearance is preserved.
            const src = origMat as THREE.MeshStandardMaterial;
            child.material = new THREE.MeshPhysicalMaterial({
              map:                  src.map,
              metalness:            0.62,
              roughness:            0.16,
              envMapIntensity:      1.05,
              // Clearcoat — adds a transparent lacquer layer on top.
              // Creates the sharp, moving pin-point highlights you see on diamonds.
              clearcoat:            1.0,
              clearcoatRoughness:   0.04,
              // Iridescence — thin-film interference that splits light into colours.
              // Simulates diamond dispersion (rainbow "fire") on the stone facets.
              iridescence:          0.35,
              iridescenceIOR:       2.42,
              iridescenceThicknessRange: [100, 400] as [number, number],
              reflectivity:         1.0,
            });
          } else {
            child.material = DIAMOND_NAME.test(child.name) ? sc.diamondMat : sc.metalMat;
          }
        });

        // Moderate sparkle lights — low enough to not blow out the gold,
        // but the moving clearcoat specular gives animated diamond fire.
        sc.sparkleL1.intensity  = 0.55;
        sc.sparkleL2.intensity  = 0.35;
        sc.keyLight.intensity   = 0.30;
        sc.fillLight.intensity  = 0.12;
        sc.crownLight.intensity = 0.18;
        // Minimal bloom — just enough to make the specular hotspots glow
        // without hazing the whole model white.
        sc.bloom.strength     = 0.06;
        sc.bloom.threshold    = 0.96;
        sc.renderer.toneMappingExposure = 0.80;

        sc.ringParts = model as unknown as THREE.Group;
        sc.group.add(model);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        // GLB failed → fall back to procedural; restore lighting defaults
        if (cancelled) return;
        console.error('[Ring3DViewer] GLB load failed:', err);
        sc.sparkleL1.intensity  = 1.8;
        sc.sparkleL2.intensity  = 1.1;
        sc.keyLight.intensity   = 0.75;
        sc.fillLight.intensity  = 0.22;
        sc.crownLight.intensity = 0.38;
        sc.bloom.strength       = 0.22;
        sc.bloom.threshold      = 0.88;
        sc.renderer.toneMappingExposure = 0.95;
        setUsingModel(false);
        const {parts,centreDiamond} = buildProceduralParts(sc.metalMat,sc.diamondMat);
        sc.ringParts=parts; sc.centreDiamond=centreDiamond; sc.group.add(parts);
        setIsLoading(false);
      },
    );
    return () => { cancelled = true; };
  }, [modelUrl, buildProceduralParts]);

  // ─── Head / band style → rebuild procedural (skipped when GLB loaded) ────
  useEffect(() => {
    if (modelUrl) return;
    const sc = sceneRef.current; if (!sc) return;
    sc.group.remove(sc.ringParts); disposeGroup(sc.ringParts);
    const {parts,centreDiamond} = buildProceduralParts(sc.metalMat,sc.diamondMat);
    sc.ringParts=parts; sc.centreDiamond=centreDiamond; sc.group.add(parts);
  }, [headStyle,bandStyle,buildProceduralParts,modelUrl]);

  // ─── Metal → update shared material (works for both GLB and procedural) ──
  useEffect(() => {
    const sc = sceneRef.current; if (!sc) return;
    const p = getPreset(metal);
    sc.metalMat.color.setHex(p.color); sc.metalMat.metalness=p.metalness;
    sc.metalMat.roughness=p.roughness; sc.metalMat.envMapIntensity=p.envMapIntensity;
    sc.metalMat.clearcoat=p.clearcoat; sc.metalMat.needsUpdate=true;
  }, [metal]);

  // ─── Diamond shape / carat (procedural only) ─────────────────────────────
  useEffect(() => {
    if (modelUrl) return;
    const sc = sceneRef.current; if (!sc?.centreDiamond) return;
    const old = sc.centreDiamond.geometry;
    sc.centreDiamond.geometry = buildDiamondGeom(diamondShape||'round', caratWeight||1.0);
    old.dispose();
  }, [diamondShape,caratWeight,modelUrl]);

  const setView = (x:number,y:number) => { const sc=sceneRef.current; if(sc){sc.rotX=x;sc.rotY=y;} };

  const headLabel:Record<string,string> = {'four-claw':'4-Prong','six-claw':'6-Prong',bezel:'Bezel',halo:'Halo','classic-halo':'Classic Halo','floral-halo':'Floral Halo','hidden-halo':'Hidden Halo','dual-halo':'Dual Halo',pave:'Pavé'};
  const bandLabel:Record<string,string> = {plain:'Solitaire','knife-edge':'Knife Edge',pave:'Pavé','half-pave':'Half Pavé',channel:'Channel',twisted:'Twisted','three-stone':'Three Stone',baguette:'Baguette',floating:'Floating',eternity:'Eternity'};

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: 420 }}>
      <canvas ref={canvasRef} className="w-full h-full block"
        style={{ height: 420, cursor: 'grab', touchAction: 'none' }} />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-20">
          <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[11px] font-sans text-charcoal">Loading 3D model…</p>
        </div>
      )}

      {/* Model quality badge */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
        {usingModel ? (
          <div className="bg-emerald-50 border border-emerald-200 text-[9px] font-sans px-2 py-0.5 text-emerald-700 font-semibold tracking-widest uppercase shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Real 3D Model
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-[9px] font-sans px-2 py-0.5 text-amber-700 tracking-widest uppercase shadow-sm">
            Preview Only
          </div>
        )}
        {!usingModel && (
          <>
            <div className="bg-white/90 border border-gray-200 text-[9px] font-sans px-2 py-0.5 text-charcoal font-semibold tracking-widest uppercase shadow-sm">
              {headLabel[headStyle]||headStyle}
            </div>
            {bandStyle!=='plain' && (
              <div className="bg-white/90 border border-gray-200 text-[9px] font-sans px-2 py-0.5 text-charcoal tracking-widest uppercase shadow-sm">
                {bandLabel[bandStyle]||bandStyle}
              </div>
            )}
          </>
        )}
      </div>

      {/* View presets */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 border border-gray-200 rounded-sm px-2 py-1 shadow-sm">
        {([{label:'Front',x:0.18,y:0},{label:'Side',x:0.10,y:Math.PI/2},{label:'Top',x:Math.PI/2,y:0},{label:'¾ View',x:0.42,y:0.52}] as const).map(v=>(
          <button key={v.label} onClick={()=>setView(v.x,v.y)}
            className="px-2 py-0.5 text-[10px] font-sans text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded transition-colors">
            {v.label}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      <div className="absolute top-3 right-3 text-[10px] font-sans text-gray-400 pointer-events-none select-none flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
        </svg>
        Drag · Scroll
      </div>
    </div>
  );
}
