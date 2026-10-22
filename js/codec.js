/* ==========================================================================
   Packs an order into a short, URL-safe string so the phone checklist link
   (and its QR code) carries the whole order — no server needed to open it.
   Plates, notes and uploaded images are left out to keep the link short.
   ========================================================================== */
import { TYPES } from './data/catalog.js';
import { normalizeOrder } from './engine.js';

const ref = r => (!r ? undefined : r.custom ? { custom: { name: r.custom.name, sku: r.custom.sku } } : r.name);

export function packOrder(order) {
  return {
    v: 1, o: order.orderNo || undefined, c: order.customer || undefined, d: order.due || undefined,
    a: (order.addons || []).filter(a => a.name && a.qty > 0).map(a => ({ id: a.id, name: a.name, desc: a.desc, qty: a.qty })),
    t: order.trophies.map(t => {
      const T = TYPES[t.type], p = { type: t.type };
      if (t.qty > 1) p.qty = t.qty;
      if (t.label) p.label = t.label;
      if (T.catalog) { p.catalog = t.catalog; }
      else {
        p.base = t.base;
        if (T.posts) p.color = t.color;
        if (T.tiers === 1 && T.posts) p.height = t.height;
        if (T.tiers === 2) { p.lower = t.lower; p.upper = t.upper; p.middle = ref(t.middle); if (t.middleRiser !== 'auto') p.middleRiser = t.middleRiser; }
        if (T.posts >= 2) { if (t.riser === 'column') p.riser = 'column'; if (t.riserSize !== 'auto') p.riserSize = t.riserSize; if (t.riserHeight) p.riserHeight = t.riserHeight; if (t.trimHeight) p.trimHeight = t.trimHeight; }
        p.figure = ref(t.figure);
        if (t.trim) { p.trim = ref(t.trim); p.year = t.year; }
      }
      if (t.risers && Object.keys(t.risers).length) p.risers = t.risers;
      if (t.insert && t.insert.type && t.insert.type !== 'mylar') p.insert = { type: t.insert.type };
      if (t.extras && t.extras.length) p.extras = t.extras;
      return p;
    })
  };
}

const toB64url = bytes => {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = str => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};
async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeOrder(order) {
  const json = new TextEncoder().encode(JSON.stringify(packOrder(order)));
  try {
    if (typeof CompressionStream !== 'undefined') return 'z' + toB64url(await pipe(json, new CompressionStream('deflate-raw')));
  } catch (e) { /* fall through to uncompressed */ }
  return 'j' + toB64url(json);
}

export async function decodeOrder(code) {
  const kind = code[0], bytes = fromB64url(code.slice(1));
  const json = kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  const p = JSON.parse(new TextDecoder().decode(json));
  return normalizeOrder({ orderNo: p.o, customer: p.c, due: p.d, addons: p.a, trophies: p.t }).order;
}

export function hashCode(str) {
  let h = 5381; for (let i = 0; i < str.length; i++) h = (h * 33 ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
