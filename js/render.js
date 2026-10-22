/* ==========================================================================
   LyteWork Trophy Build Sheets — TROPHY RENDERER
   Draws a trophy as SVG, to scale in inches, using the same artwork as
   buildatrophy.com (column swatches, base textures, cup, eagle, figures, trims).
   Returns a string, so it works in the browser and in the command-line tool.
   ========================================================================== */
import { SWATCHES, ART, TRIMS } from './data/figures.js';
import { TYPES } from './data/catalog.js';
import { baseOption, riserFor, middleRiserHeight, trimColumnHeight, columnRiserHeight, itemInfo, catalogProduct, catalogVariant, inch, riserIn, standsBare } from './engine.js';
import { jds } from './data/jds.js';
import { BOUNDS } from './artfit.js';

const COL_W = 1.75;            // column diameter
const K = 0.12;                // how much depth shows as height on top faces
const P = 0.025;               // perspective narrowing per inch of depth
const FIG_H = 5.5;             // nominal figure height
const TRIM_H = 2.6;            // nominal trim height (scaled by the trim's own scale)
const EAGLE_H = 2.25;
const RING_RX = 1.02, RING_RY = 0.2;
const RING_H = 0.3;            // check-ring collar height

let seq = 0;
/* JDS photos: Cloudinary crops them tight (e_trim); the "cutout" filter drops the light-gray backdrop.
   Opacity = 4·(red − blue) + 5·(0.86 − brightness): keeps gold and anything darker than the backdrop. */
export const jdsPhoto = url => (/res\.cloudinary\.com\/.+\/image\/upload\//.test(url || '') && !/\/e_trim\//.test(url) ? url.replace('/image/upload/', '/image/upload/e_trim/') : url);
const isJdsPhoto = url => /res\.cloudinary\.com/.test(url || '');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = n => +n.toFixed(3);
const hexes = s => (String(s).match(/#[0-9a-f]{3,6}\b/gi) || []);

export function renderTrophySVG(t, opts = {}) {
  const o = { dims: false, plate: true, shadow: true, className: '', title: '', ...opts };
  const id = 'r' + (++seq).toString(36) + Math.random().toString(36).slice(2, 5);
  const T = TYPES[t.type];
  const defs = new Map();
  const out = [];
  const dims = [];
  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  const grow = (x0, y0, x1, y1) => { box.x0 = Math.min(box.x0, x0); box.x1 = Math.max(box.x1, x1); box.y0 = Math.min(box.y0, y0); box.y1 = Math.max(box.y1, y1); };
  let top_ = 0;                                   // highest point (inches above ground)

  /* ---------- defs ---------- */
  const def = (key, svg) => { if (!defs.has(key)) defs.set(key, svg); return `${id}-${key}`; };
  const colTex = color => {
    const sw = SWATCHES.columns[color] || SWATCHES.columns.Gold;
    const c = hexes(sw.fallback); const a = c[0] || '#664', b = c[1] || '#cc9';
    return def('col-' + color, `<linearGradient id="${id}-colfb-${color}" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>
<pattern id="${id}-col-${color}" patternUnits="userSpaceOnUse" width="${COL_W}" height="${COL_W * 1.6}"><rect width="${COL_W}" height="${COL_W * 1.6}" fill="url(#${id}-colfb-${color})"/><image href="${esc(sw.url)}" width="${COL_W}" height="${COL_W * 1.6}" preserveAspectRatio="xMidYMid slice"/></pattern>`);
  };
  const baseTex = tex => {
    const sw = SWATCHES.bases[tex] || SWATCHES.bases.black;
    return def('base-' + tex, `<pattern id="${id}-base-${tex}" patternUnits="userSpaceOnUse" width="8" height="4"><rect width="8" height="4" fill="${sw.fallback}"/><image href="${esc(sw.url)}" width="8" height="4" preserveAspectRatio="xMidYMid slice"/></pattern>`);
  };
  def('shade', `<linearGradient id="${id}-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".58"/><stop offset=".2" stop-color="#000" stop-opacity=".12"/><stop offset=".42" stop-color="#fff" stop-opacity=".16"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".58"/></linearGradient>`);
  def('gold', `<linearGradient id="${id}-gold" x1="0" x2="1"><stop offset="0" stop-color="#9c7c3c"/><stop offset=".38" stop-color="#f6dc8e"/><stop offset=".62" stop-color="#e2c173"/><stop offset="1" stop-color="#8f6f33"/></linearGradient>`);
  def('plate', `<linearGradient id="${id}-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cf6b"/><stop offset=".5" stop-color="#f7e2a2"/><stop offset="1" stop-color="#c49a2c"/></linearGradient>`);
  def('face', `<linearGradient id="${id}-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>`);
  def('topface', `<linearGradient id="${id}-topface" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".28"/></linearGradient>`);
  /* alpha from "how gold / how dark" — gray or white backdrop goes clear, gold stays */
  def('cutout', `<filter id="${id}-cutout" color-interpolation-filters="sRGB" x="0" y="0" width="1" height="1"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2.937 -3.576 -4.361 0 4.3"/><feComponentTransfer><feFuncA type="linear" slope="1.6" intercept="-0.15"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter>`);
  def('ground', `<radialGradient id="${id}-ground"><stop offset="0" stop-color="#1d2433" stop-opacity=".28"/><stop offset="1" stop-color="#1d2433" stop-opacity="0"/></radialGradient>`);

  /* ---------- projection: world (x across, z depth from base front, h height) → screen ---------- */
  const sx = (x, z) => x * (1 - z * P);
  const sy = (h, z) => -h - z * K;

  /* ---------- primitives ---------- */
  function slab(g, h0, z0, tex, shape = 'rect') {   // a base or lid: front face(s) + top face
    const { w, h, d } = g;
    const fill = `url(#${baseTex(tex)})`;
    if (shape === 'tri') {
      // 3-post: flat front, sides running back to a blunt tip (x across, z back from the front)
      const c = 0.1 * w;
      const pts = [[-w / 2 + c, 0], [w / 2 - c, 0], [w / 2, 0.12 * d], [0.07 * w, d], [-0.07 * w, d], [-w / 2, 0.12 * d]];
      const P2 = (x, zr, hh) => [sx(x, z0 + zr), sy(hh, z0 + zr)];
      const poly = hh => pts.map(([x, zr]) => P2(x, zr, hh).map(f).join(',')).join(' ');
      out.push(`<polygon points="${poly(h0 + h)}" fill="${fill}"/><polygon points="${poly(h0 + h)}" fill="url(#${id}-topface)"/>`);
      const face = (i, j, shade) => {
        const [ax, az] = pts[i], [bx, bz] = pts[j];
        const q = [P2(ax, az, h0 + h), P2(bx, bz, h0 + h), P2(bx, bz, h0), P2(ax, az, h0)].map(pp => pp.map(f).join(',')).join(' ');
        out.push(`<polygon points="${q}" fill="${fill}"/><polygon points="${q}" fill="url(#${id}-face)"/>${shade ? `<polygon points="${q}" fill="#000" fill-opacity="${shade}"/>` : ''}`);
      };
      face(5, 0, 0.16); face(1, 2, 0.16); face(0, 1, 0);
      const fL = sx(pts[0][0], z0), fR = sx(pts[1][0], z0);
      const yFrontTop = sy(h0 + h, z0), yFrontBot = sy(h0, z0);
      out.push(`<line x1="${f(fL)}" y1="${f(yFrontTop)}" x2="${f(fR)}" y2="${f(yFrontTop)}" stroke="#fff" stroke-opacity=".35" stroke-width=".03"/>`);
      grow(sx(-w / 2, z0), sy(h0 + h, z0 + d), sx(w / 2, z0), yFrontBot);
      return { yFrontTop, yFrontBot, fL, fR, w: fR - fL };
    }
    const fL = sx(-w / 2, z0), fR = sx(w / 2, z0), bL = sx(-w / 2, z0 + d), bR = sx(w / 2, z0 + d);
    const yFrontBot = sy(h0, z0), yFrontTop = sy(h0 + h, z0), yBackTop = sy(h0 + h, z0 + d);
    const topPts = `${f(fL)},${f(yFrontTop)} ${f(fR)},${f(yFrontTop)} ${f(bR)},${f(yBackTop)} ${f(bL)},${f(yBackTop)}`;
    out.push(`<polygon points="${topPts}" fill="${fill}"/><polygon points="${topPts}" fill="url(#${id}-topface)"/>`);
    out.push(`<rect x="${f(fL)}" y="${f(yFrontTop)}" width="${f(fR - fL)}" height="${f(h)}" fill="${fill}"/><rect x="${f(fL)}" y="${f(yFrontTop)}" width="${f(fR - fL)}" height="${f(h)}" fill="url(#${id}-face)"/>`);
    out.push(`<line x1="${f(fL)}" y1="${f(yFrontTop)}" x2="${f(fR)}" y2="${f(yFrontTop)}" stroke="#fff" stroke-opacity=".35" stroke-width=".03"/>`);
    grow(fL, yBackTop, fR, yFrontBot);
    return { yFrontTop, yFrontBot, fL, fR, w: fR - fL };
  }
  /* A column standing in its check rings. The ring is a collar: its lip and back
     show behind the column, its front band in front — so the column sits IN it.
     open = the top is exposed (a riser carrying a figure), not tucked under a lid. */
  function column(x, z, h0, len, color, { rings = true, open = false } = {}) {
    const s = 1 - z * P, w = COL_W * s;
    const cx = sx(x, z), yb = sy(h0, z), yt = sy(h0 + len, z);
    const rb = RING_H * s, rx = RING_RX * s, ry = RING_RY * s;
    const tex = colTex(color);
    const back = z > 0 && o._backZ && z >= o._backZ - 0.01;
    const dimA = back ? ' opacity=".8"' : '';
    if (rings) lip(cx, yb - rb, rx, ry, w, dimA);                         // bottom collar lip, behind the column
    const top = open && rings ? yt + ry * 0.4 : yt, bot = rings ? yb - rb * 0.5 : yb;
    out.push(`<g transform="translate(${f(cx - w / 2)},${f(top)})"><rect width="${f(w)}" height="${f(bot - top)}" fill="url(#${tex})"/><rect width="${f(w)}" height="${f(bot - top)}" fill="url(#${id}-shade)"/>${back ? `<rect width="${f(w)}" height="${f(bot - top)}" fill="#0d1322" fill-opacity=".32"/>` : ''}</g>`);
    if (rings) {
      band(cx, yb - rb, yb, rx, ry, dimA);                                // bottom collar front
      band(cx, yt, yt + rb, rx, ry, dimA);                                // top collar front
      if (open) lip(cx, yt, rx, ry, w, dimA, true);                       // exposed top: the figure stands on this
    }
    grow(cx - rx, yt - ry, cx + rx, yb);
    top_ = Math.max(top_, h0 + len);
    return { cx, yt, s };
  }
  function lip(cx, y, rx, ry, w, extra = '', capped = false) {
    out.push(`<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${id}-gold)" stroke="#6d5323" stroke-width=".02"${extra}/>` +
      `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(w / 2)}" ry="${f(ry * w / 2 / rx)}" fill="${capped ? `url(#${id}-gold)` : '#4a3a18'}"${capped ? ' fill-opacity=".85"' : ''}${extra}/>`);
  }
  function band(cx, y0, y1, rx, ry, extra = '') {
    out.push(`<path d="M${f(cx - rx)} ${f(y0)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(y0)}L${f(cx + rx)} ${f(y1)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(y1)}Z" fill="url(#${id}-gold)" stroke="#6d5323" stroke-width=".02"${extra}/>`);
  }
  /* Draw a picture so its solid part is h tall, centered on cx, with its bottom at yBottom.
     Uses the measured bounds (artfit.js) when we have them; otherwise fits the whole image. */
  function image(url, cx, yBottom, h, w, { s = 1, dim = false, hBase = 0 } = {}) {
    h *= s; w *= s;
    const cut = isJdsPhoto(url);
    const bd = !cut && BOUNDS[url];
    let x = cx - w / 2, y = yBottom - h, W = w, H = h, par = 'xMidYMax meet', drawn = h, cl = cx - Math.min(w / 2, h * 0.42), cr = cx + Math.min(w / 2, h * 0.42);
    if (bd) {
      const chF = bd.b - bd.t, cwF = bd.r - bd.l;
      H = h / chF; W = H * bd.a;
      if (W * cwF > w) { const k = w / (W * cwF); H *= k; W *= k; drawn = h * k; }
      x = cx - W * (bd.l + bd.r) / 2; y = yBottom - H * bd.b; par = 'none';
      cl = x + W * bd.l; cr = x + W * bd.r;
    }
    if (url) out.push(`<image href="${esc(cut ? jdsPhoto(url) : url)}" x="${f(x)}" y="${f(y)}" width="${f(W)}" height="${f(H)}" preserveAspectRatio="${par}"${cut ? ` filter="url(#${id}-cutout)"` : ''}${dim ? ' opacity=".82"' : ''}/>`);
    grow(cl, yBottom - drawn, cr, yBottom);
    top_ = Math.max(top_, hBase + drawn);
    return drawn;
  }
  function placeholder(name, cx, yBottom, h) {
    const w = h * 0.7;
    out.push(`<rect x="${f(cx - w / 2)}" y="${f(yBottom - h)}" width="${f(w)}" height="${f(h)}" rx=".3" fill="#f6ecd0" stroke="#b89f5e" stroke-width=".06" stroke-dasharray=".25 .18"/>` +
      `<text x="${f(cx)}" y="${f(yBottom - h / 2)}" text-anchor="middle" dominant-baseline="middle" font-family="Outfit,Helvetica,Arial,sans-serif" font-size="${f(Math.min(0.5, w / Math.max(6, name.length) * 1.7))}" fill="#6d5a2b">${esc(name)}</text>`);
    grow(cx - w / 2, yBottom - h, cx + w / 2, yBottom);
  }
  function item(ref, kind, cx, yBottom, hBase, s = 1) {  // figure / trim / holder
    const info = itemInfo(ref);
    if (!info) return 0;
    const j = info.sku ? jds(info.sku) : null;
    let h = j && j.height ? j.height : TRIMS.includes(info) ? TRIM_H * (info.scale || 1) : FIG_H * (info.scale || 1.3) / 1.3;
    if (info.custom) h = info.height || (kind === 'figure' ? FIG_H : 3.4);
    const url = info.url || (j && j.img) || '';
    let drawn = h * s;
    if (url) drawn = image(url, cx, yBottom, h, Math.max(h * 1.3, 3.5), { s, hBase });
    else placeholder(info.name, cx, yBottom, h * s);
    top_ = Math.max(top_, hBase + drawn);
    return drawn;
  }
  function plate(g, slabInfo) {
    if (!o.plate) return;
    const lines = ((t.plates && t.plates[0]) || []).filter(x => x && x.trim());
    const pw = Math.min(g.w * 0.8, 10.5), ph = Math.min(g.h * (g.slant ? 0.56 : 0.64), 1.15);
    const px = -pw / 2, py = slabInfo.yFrontTop + (g.h - ph) / 2;
    out.push(`<rect x="${f(px)}" y="${f(py)}" width="${f(pw)}" height="${f(ph)}" rx=".03" fill="url(#${id}-plate)" stroke="#8a6a24" stroke-width=".015"/>`);
    if (!lines.length) return;
    const n = lines.length, fs = Math.min(ph / n * 0.74, 0.34);
    lines.forEach((ln, i) => {
      const y = py + ph / 2 + (i - (n - 1) / 2) * fs * 1.12;
      const est = ln.length * fs * 0.62, max = pw * 0.9;
      out.push(`<text x="0" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-family="'Times New Roman',Times,serif" font-weight="700" font-size="${f(fs)}" fill="#1b1409"${est > max ? ` textLength="${f(max)}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(ln.toUpperCase())}</text>`);
    });
  }
  const dim = (h0, h1, z, label) => dims.push({ y0: sy(h0, z), y1: sy(h1, z), label });
  // draws the JDS riser in a spot, returns its height (0 if the spot has none)
  function riserPart(slot, x, z, hStart) {
    const r = riserIn(t, slot);
    if (!r) return 0;
    if (r.img) image(r.img, sx(x, z), sy(hStart, z) + 0.02, r.height, r.height * 1.2, { hBase: hStart });
    else placeholder(r.name, sx(x, z), sy(hStart, z), r.height);
    return r.height;
  }

  /* ---------- catalog items (resin / cup trophies): just the product photo ---------- */
  if (T.catalog) {
    const v = catalogVariant(t), p = catalogProduct(t);
    const m = v && v.opts.join(' ').match(/(\d+)(?:\s+(\d)\/(\d))?\s*"/);
    const hIn = m ? +m[1] + (m[2] ? m[2] / m[3] : 0) : 9 * ((v && v.sizeScale) || 0.9);
    const url = v ? v.img : p ? p.img : '';
    if (url) image(url, 0, 0, hIn, hIn * 0.8);
    else placeholder(T.name, 0, 0, 8);
    if (o.shadow) out.unshift(`<ellipse cx="0" cy="0" rx="${f(hIn * 0.35)}" ry="${f(hIn * 0.035)}" fill="url(#${id}-ground)"/>`);
    return finish();
  }

  /* ---------- column trophies ---------- */
  const base = baseOption(t);
  const g = base.geo;
  const tex = base.tex;
  if (o.shadow) out.push(`<ellipse cx="0" cy="${f(-g.d * K * 0.3)}" rx="${f(g.w * 0.62)}" ry="${f(g.d * K * 0.9 + 0.35)}" fill="url(#${id}-ground)"/>`);
  const shape = T.posts === 3 ? 'tri' : 'rect';
  const baseSlab = slab(g, 0, 0, tex, shape);
  plate(g, baseSlab);
  const zMid = g.d / 2;
  const h0 = g.h;                                      // top of base

  if (t.type === 'fob') {
    item(t.figure, 'figure', 0, sy(h0, zMid), h0);
    return finish();
  }
  if (t.type === 'col1' || t.type === 'col1trim') {
    const x = t.type === 'col1trim' ? -g.w * 0.19 : 0;
    const rh = riserPart('main', x, zMid, h0);
    if (rh) item(t.figure, 'figure', sx(x, zMid), sy(h0 + rh, zMid), h0 + rh);
    else {
      const c = column(x, zMid, h0, t.height, t.color, { open: true });
      dim(h0, h0 + t.height, zMid, inch(t.height));
      item(t.figure, 'figure', c.cx, c.yt + 0.04, h0 + t.height);
    }
    if (t.type === 'col1trim' && t.trim) item(t.trim, 'trim', sx(g.w * 0.24, zMid), sy(h0, zMid), h0);
    return finish();
  }

  /* multi-column: one or two tiers */
  const N = T.posts;
  const lid = g.lid;
  const zL = (g.d - lid.d) / 2;
  const inset = 0.2 + COL_W / 2;
  const ax = lid.w / 2 - inset;
  let posts;
  if (N === 2) posts = [{ x: -ax, z: zL + lid.d / 2 }, { x: ax, z: zL + lid.d / 2 }];
  else if (N === 3) { const ax3 = lid.w / 2 - inset - 0.05 * lid.w; posts = [{ x: 0, z: zL + lid.d - inset * 2 }, { x: -ax3, z: zL + inset }, { x: ax3, z: zL + inset }]; }
  else posts = [{ x: -ax, z: zL + lid.d - inset }, { x: ax, z: zL + lid.d - inset }, { x: -ax, z: zL + inset }, { x: ax, z: zL + inset }];
  o._backZ = N === 3 ? zL + lid.d - inset * 2 : N === 4 ? zL + lid.d - inset : null;
  const back = posts.filter(p => o._backZ && p.z >= o._backZ - 0.01);
  const front = posts.filter(p => !back.includes(p));
  const center = { x: 0, z: zL + lid.d * (N === 3 ? 0.42 : 0.5) };

  // a centered riser column with an item on top (trim on base, middle item on middle lid)
  const centerPost = (hStart, len, ref, kind, slot) => {
    if (standsBare(t, slot)) { item(ref, kind, sx(center.x, center.z), sy(hStart, center.z), hStart); return; }
    const rh = riserPart(slot, center.x, center.z, hStart);
    if (rh) { item(ref, kind, sx(center.x, center.z), sy(hStart + rh, center.z), hStart + rh); return; }
    const c = column(center.x, center.z, hStart, len, t.color, { open: true });
    item(ref, kind, c.cx, c.yt + 0.04, hStart + len);
  };

  const tiers = T.tiers === 2 ? [t.lower, t.upper] : [t.height];
  let hNow = h0;
  tiers.forEach((len, ti) => {
    const onBase = ti === 0;
    back.forEach(p => column(p.x, p.z, hNow, len, t.color));
    if (onBase && t.trim) centerPost(hNow, trimColumnHeight(t), t.trim, 'trim', 'trim');
    if (!onBase && T.tiers === 2) centerPost(hNow, middleRiserHeight(t), t.middle, 'trim', 'middle');
    front.forEach(p => column(p.x, p.z, hNow, len, t.color));
    dim(hNow, hNow + len, front[0].z, inch(len));
    hNow += len;
    slab(lid, hNow, zL, tex, shape);
    hNow += lid.h;
  });

  // on the top lid: back eagles, riser + figure, front eagles
  const eagle = p => image(ART.eagle, sx(p.x, p.z), sy(hNow, p.z) + 0.02, EAGLE_H, EAGLE_H * 0.9, { s: 1 - p.z * P, dim: back.includes(p), hBase: hNow });
  back.forEach(eagle);
  const r = riserFor(t);
  const cyTop = sy(hNow, center.z);
  const topRiser = riserIn(t, 'top');
  if (topRiser) {
    const rh = riserPart('top', center.x, center.z, hNow);
    item(t.figure, 'figure', sx(center.x, center.z), sy(hNow + rh, center.z), hNow + rh);
  } else if (t.riser === 'column') {
    const ch = columnRiserHeight(t);
    const c = column(center.x, center.z, hNow, ch, t.color, { open: true });
    item(t.figure, 'figure', c.cx, c.yt + 0.04, hNow + ch);
  } else {
    const cupH = image(ART.cup, sx(center.x, center.z), cyTop + 0.02, r.height, r.height * 1.1, { hBase: hNow });
    item(t.figure, 'figure', sx(center.x, center.z), cyTop + 0.02 - cupH + 0.1, hNow + cupH);
  }
  if (topRiser) dim(hNow, hNow + topRiser.height, center.z, inch(topRiser.height) + ' riser');
  else dim(hNow, hNow + (t.riser === 'column' ? columnRiserHeight(t) : r.height), center.z, t.riser === 'column' ? inch(columnRiserHeight(t)) : r.label);
  front.forEach(eagle);
  return finish();

  /* ---------- assemble ---------- */
  function finish() {
    const totalH = top_;
    let dimsSvg = '';
    if (o.dims && dims.length && isFinite(box.x0)) {
      const span = box.y1 - box.y0;
      const fs = Math.max(0.34, span * 0.026);
      const x = box.x0 - fs * 1.6;
      dims.forEach(d => {
        dimsSvg += `<g stroke="#233354" stroke-width="${f(fs * 0.07)}"><line x1="${f(x)}" y1="${f(d.y0 - 0.05)}" x2="${f(x)}" y2="${f(d.y1 + 0.05)}"/><line x1="${f(x - fs * .3)}" y1="${f(d.y0)}" x2="${f(x + fs * .3)}" y2="${f(d.y0)}"/><line x1="${f(x - fs * .3)}" y1="${f(d.y1)}" x2="${f(x + fs * .3)}" y2="${f(d.y1)}"/></g>` +
          `<text x="${f(x - fs * .45)}" y="${f((d.y0 + d.y1) / 2)}" text-anchor="end" dominant-baseline="central" font-family="Outfit,Helvetica,Arial,sans-serif" font-size="${f(fs)}" font-weight="600" fill="#233354">${esc(d.label)}</text>`;
      });
      grow(x - fs * (0.6 + 0.62 * Math.max(...dims.map(d => d.label.length))), box.y0, x, box.y1);
    }
    const pad = Math.max(0.4, (box.y1 - box.y0) * 0.03);
    const vb = [box.x0 - pad, box.y0 - pad, box.x1 - box.x0 + pad * 2, box.y1 - box.y0 + pad * 2].map(f);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMax meet"${o.className ? ` class="${esc(o.className)}"` : ''} role="img" aria-label="${esc(o.title || T.name)}" data-height-in="${f(totalH)}"><defs>${[...defs.values()].join('')}</defs>${out.join('')}${dimsSvg}</svg>`;
    return o.withInfo ? { svg, heightIn: totalH } : svg;
  }
}

/* Nominal overall height in inches (figure tops vary a little by artwork). */
export function trophyHeight(t) {
  return renderTrophySVG(t, { withInfo: true, plate: false, shadow: false }).heightIn;
}
