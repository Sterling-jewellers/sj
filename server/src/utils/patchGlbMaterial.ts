/**
 * GLB Material Patcher
 *
 * Trellis generates GLB files with:
 *   - roughnessFactor: 1   (fully matte — looks like grey clay)
 *   - no metallicFactor    (defaults to 0 — no metallic sheen)
 *
 * This utility rewrites the GLB JSON header to inject correct PBR values
 * for jewellery — white gold, yellow gold, rose gold, platinum, silver.
 *
 * GLB binary layout:
 *   [0..3]   magic "glTF"
 *   [4..7]   version (uint32 LE = 2)
 *   [8..11]  total length (uint32 LE)
 *   [12..15] JSON chunk length (uint32 LE)
 *   [16..19] JSON chunk type  (uint32 LE = 0x4E4F534A = "JSON")
 *   [20 .. 20+jsonLen-1]  JSON payload (padded with spaces to 4-byte boundary)
 *   [...] BIN chunk
 */

interface GlbMaterialParams {
  metallicFactor:  number;  // 0 = non-metal, 1 = full metal
  roughnessFactor: number;  // 0 = mirror-smooth, 1 = fully rough
  doubleSided:     boolean; // true = inside faces visible (important for bangles)
}

const METAL_PARAMS: Record<string, GlbMaterialParams> = {
  'white-gold':  { metallicFactor: 0.95, roughnessFactor: 0.12, doubleSided: true },
  'yellow-gold': { metallicFactor: 0.95, roughnessFactor: 0.12, doubleSided: true },
  'rose-gold':   { metallicFactor: 0.92, roughnessFactor: 0.14, doubleSided: true },
  platinum:      { metallicFactor: 0.96, roughnessFactor: 0.10, doubleSided: true },
  silver:        { metallicFactor: 0.94, roughnessFactor: 0.15, doubleSided: true },
  default:       { metallicFactor: 0.93, roughnessFactor: 0.12, doubleSided: true },
};

export function patchGlbMaterial(glbBuffer: Buffer, metalType?: string): Buffer {
  // ── 1. Read JSON chunk ────────────────────────────────────────────────────
  const jsonChunkLen  = glbBuffer.readUInt32LE(12);
  const jsonStart     = 20;
  const jsonEnd       = jsonStart + jsonChunkLen;
  const jsonRaw       = glbBuffer.slice(jsonStart, jsonEnd).toString('utf8').trimEnd();

  let gltf: Record<string, unknown>;
  try {
    gltf = JSON.parse(jsonRaw);
  } catch {
    console.warn('[glb-patch] Failed to parse GLB JSON — returning original');
    return glbBuffer;
  }

  // ── 2. Pick PBR params for the metal type ─────────────────────────────────
  const params = METAL_PARAMS[metalType || 'default'] ?? METAL_PARAMS['default'];

  // ── 3. Patch every material ───────────────────────────────────────────────
  const materials = gltf.materials as Array<Record<string, unknown>>;
  if (!Array.isArray(materials)) {
    console.warn('[glb-patch] No materials found — returning original');
    return glbBuffer;
  }

  for (const mat of materials) {
    const pbr = (mat.pbrMetallicRoughness ?? {}) as Record<string, unknown>;
    pbr.metallicFactor  = params.metallicFactor;
    pbr.roughnessFactor = params.roughnessFactor;
    // Keep baseColorTexture and baseColorFactor as-is — that's the product photo
    mat.pbrMetallicRoughness = pbr;
    mat.doubleSided          = params.doubleSided;
  }
  gltf.materials = materials;

  // ── 4. Rebuild JSON chunk (must stay 4-byte aligned, padded with spaces) ──
  const newJsonStr    = JSON.stringify(gltf);
  const paddedLen     = Math.ceil(newJsonStr.length / 4) * 4;
  const newJsonBuf    = Buffer.alloc(paddedLen, 0x20); // 0x20 = space
  Buffer.from(newJsonStr, 'utf8').copy(newJsonBuf);

  // ── 5. Rebuild GLB buffer ─────────────────────────────────────────────────
  const binChunkStart = jsonEnd;                          // original BIN starts here
  const binChunk      = glbBuffer.slice(binChunkStart);   // chunk-length + chunk-type + data

  const newTotalLen = 12 + 8 + paddedLen + binChunk.length;
  const out         = Buffer.alloc(newTotalLen);

  // Header
  glbBuffer.copy(out, 0, 0, 12);                  // magic + version
  out.writeUInt32LE(newTotalLen, 8);               // total length

  // JSON chunk header
  out.writeUInt32LE(paddedLen,     12);            // JSON chunk length
  out.writeUInt32LE(0x4E4F534A,   16);            // "JSON"
  newJsonBuf.copy(out, 20);                        // JSON payload

  // BIN chunk (unchanged)
  binChunk.copy(out, 20 + paddedLen);

  console.log(`[glb-patch] Patched material → metallic:${params.metallicFactor} roughness:${params.roughnessFactor} doubleSided:${params.doubleSided}`);
  return out;
}
