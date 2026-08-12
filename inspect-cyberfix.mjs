import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || './gen02/models/cyberfix.glb';
const output = process.argv[3] || './cyberfix-display-inventory.json';
const buf = fs.readFileSync(input);
if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2) {
  throw new Error('Expected a GLB v2 file: ' + input);
}
let offset = 12;
let json;
while (offset + 8 <= buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.readUInt32LE(offset + 4);
  const start = offset + 8;
  const end = start + len;
  if (end > buf.length) throw new Error('Invalid GLB chunk length');
  if (type === 0x4e4f534a) {
    json = JSON.parse(buf.subarray(start, end).toString('utf8').replace(/\0+$/,'').trim());
    break;
  }
  offset = end;
}
if (!json) throw new Error('GLB JSON chunk not found');

const WORDS = /(?:screen|display|billboard|poster|sign|advert|promo|project|monitor|television|\btv\b|marquee|logo|brand|graphic|artwork|video|media|panel|kiosk|terminal|lightbox)/i;
const KNOWN = /(?:samsy|smsy|nintendo|notnyc|jiometry)/i;
const STRUCTURAL = /(?:wall|floor|ground|road|street|roof|ceiling|glass|window|facade|building|concrete|brick|metal|frame|beam|column|rail|pipe|duct|stair|door|sidewalk|curb|terrain|neon|light|lamp|trim|border|collision|shadow|sky|water)/i;

const meshes = json.meshes || [];
const nodes = json.nodes || [];
const materials = json.materials || [];
const textures = json.textures || [];
const images = json.images || [];
const accessors = json.accessors || [];

function texImageName(textureIndex) {
  if (!Number.isInteger(textureIndex)) return '';
  const t = textures[textureIndex];
  if (!t) return '';
  let source = t.source;
  if (!Number.isInteger(source) && t.extensions) {
    const ext = t.extensions.KHR_texture_basisu || t.extensions.EXT_texture_webp || t.extensions.MSFT_texture_dds;
    if (ext && Number.isInteger(ext.source)) source = ext.source;
  }
  return Number.isInteger(source) && images[source] ? images[source].name || '' : '';
}
function materialMeta(mi) {
  const m = materials[mi] || {};
  const base = m.pbrMetallicRoughness?.baseColorTexture?.index;
  const emissive = m.emissiveTexture?.index;
  const names = [m.name || '', texImageName(base), texImageName(emissive)].filter(Boolean).join(' ');
  const ef = m.emissiveFactor || [0,0,0];
  const emissiveLike = Boolean(m.emissiveTexture) || ef.reduce((a,b)=>a+(+b||0),0) > 0.04 || Boolean(m.extensions?.KHR_materials_unlit);
  const textured = Number.isInteger(base) || Number.isInteger(emissive);
  return { name:m.name || '', imageNames:[texImageName(base),texImageName(emissive)].filter(Boolean), names, emissiveLike, textured };
}
function accessorCount(i) { return Number.isInteger(i) && accessors[i] ? accessors[i].count || 0 : 0; }

const meshToNodes = new Map();
nodes.forEach((n,ni)=>{ if (Number.isInteger(n.mesh)) { if (!meshToNodes.has(n.mesh)) meshToNodes.set(n.mesh,[]); meshToNodes.get(n.mesh).push({index:ni,name:n.name||''}); } });

const candidates = [];
meshes.forEach((mesh, mi) => {
  const refs = meshToNodes.get(mi) || [];
  (mesh.primitives || []).forEach((pr, pi) => {
    if (!Number.isInteger(pr.material)) return;
    const mm = materialMeta(pr.material);
    const combined = [mesh.name||'', ...refs.map(x=>x.name), mm.names].join(' ');
    const named = WORDS.test(combined) || KNOWN.test(combined);
    const structural = STRUCTURAL.test(combined) && !named;
    const posCount = accessorCount(pr.attributes?.POSITION);
    const uvCount = accessorCount(pr.attributes?.TEXCOORD_0);
    const indexCount = accessorCount(pr.indices);
    const triangles = pr.mode == null || pr.mode === 4;
    const flatSimple = triangles && posCount >= 4 && posCount <= 12 && indexCount <= 36;
    const heuristic = !structural && !named && mm.textured && mm.emissiveLike && uvCount > 0 && flatSimple;
    if (named || heuristic) {
      candidates.push({
        meshIndex: mi,
        primitiveIndex: pi,
        meshName: mesh.name || '',
        nodes: refs,
        materialIndex: pr.material,
        materialName: mm.name,
        imageNames: mm.imageNames,
        namedMatch: named,
        heuristicMatch: heuristic,
        positionCount: posCount,
        uvCount,
        indexCount,
        emissiveLike: mm.emissiveLike,
        textured: mm.textured
      });
    }
  });
});

const report = {
  source: path.resolve(input),
  totals: { meshes: meshes.length, nodes: nodes.length, materials: materials.length, textures: textures.length, images: images.length },
  candidates: {
    total: candidates.length,
    named: candidates.filter(x=>x.namedMatch).length,
    heuristic: candidates.filter(x=>x.heuristicMatch).length
  },
  displayCandidates: candidates,
  allMeshNames: meshes.map((m,i)=>({index:i,name:m.name||'',primitiveCount:(m.primitives||[]).length})),
  allMaterialNames: materials.map((m,i)=>({index:i,name:m.name||'',...materialMeta(i)})),
  allNodeMeshRefs: nodes.map((n,i)=>({index:i,name:n.name||'',mesh:Number.isInteger(n.mesh)?n.mesh:null})).filter(x=>x.mesh!==null)
};
fs.writeFileSync(output, JSON.stringify(report,null,2));
console.log(`Wrote ${output}`);
console.log(report.totals);
console.log(report.candidates);
console.log('First display candidates:');
console.table(candidates.slice(0,30).map(x=>({mesh:x.meshName,node:x.nodes[0]?.name||'',material:x.materialName,named:x.namedMatch,heuristic:x.heuristicMatch,pos:x.positionCount,idx:x.indexCount})));
