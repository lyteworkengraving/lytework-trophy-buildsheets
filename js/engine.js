/* ==========================================================================
   LyteWork Trophy Build Sheets — PARTS ENGINE
   Pure functions (no DOM). Used by the web app, the phone checklist,
   and the command-line tool, so every version produces the same lists.
   ========================================================================== */
import { RULES, RISER_CUPS, COLUMNS, PARTS, ROD_COSTS, BASES, TYPES, CATEGORY_ORDER, INSERT_TYPES } from './data/catalog.js';
import { FIGURES, TRIMS, YEAR_TRIM_SKUS, ALIASES } from './data/figures.js';
import { RESINS } from './data/resins.js';
import { jds } from './data/jds.js';
import { loadBounds } from './artfit.js';

/* Figures/trims that only exist as JDS parts (e.g. RP83053) use JDS's photo */
[...FIGURES, ...TRIMS].forEach(i => { if (!i.url && i.sku && jds(i.sku)) i.url = jds(i.sku).img; });

/* Your cost for a JDS SKU at the price tier chosen in settings */
export function jdsCost(sku) {
  const i = jds(sku);
  if (!i) return null;
  return (RULES.priceTier === 'case' ? i.caseCost ?? i.cost : i.cost ?? i.caseCost) ?? null;
}
/* Shop settings saved in the app override the defaults in catalog.js */
export function applySettings(st = {}) {
  ['shopRatePerHour', 'rushPercent', 'markup', 'priceTier'].forEach(k => { if (st[k] != null && st[k] !== '') RULES[k] = st[k]; });
  if (st.laborMinutes) Object.entries(st.laborMinutes).forEach(([k, v]) => { if (k in RULES.laborMinutes) RULES.laborMinutes[k] = v === '' || v == null ? null : +v; });
  if (st.insertCost) Object.entries(st.insertCost).forEach(([k, v]) => { if (k in RULES.insertCost) RULES.insertCost[k] = +v || 0; });
  // SKUs matched to the builder's figures and trims (from skus.html)
  if (st.figureSkus) Object.entries(st.figureSkus).forEach(([name, v]) => {
    const it = [...FIGURES, ...TRIMS].find(i => i.name === name);
    if (it && v && v.sku) { it.sku = v.sku; if (v.part) it.part = v.part; }
  });
  if (st.artBounds) loadBounds(st.artBounds);
  if (st.quote && typeof st.quote === 'object') Object.entries(st.quote).forEach(([k, v]) => { if (k in RULES.quote && v != null) RULES.quote[k] = k === 'validDays' ? (+v || 30) : String(v); });
}
export function currentSettings() {
  const { shopRatePerHour, rushPercent, markup, priceTier, laborMinutes, insertCost, quote } = RULES;
  return JSON.parse(JSON.stringify({ shopRatePerHour, rushPercent, markup, priceTier, laborMinutes, insertCost, quote }));
}
import { CUP_TROPHIES } from './data/cups.js';

/* ---------- formatting ---------- */
const FRAC = { 0.125: '⅛', 0.25: '¼', 0.375: '⅜', 0.5: '½', 0.625: '⅝', 0.75: '¾', 0.875: '⅞' };
export function inch(n, mark = '″') {
  const r = Math.round(n * 8) / 8;
  const whole = Math.floor(r);
  const f = FRAC[+(r - whole).toFixed(3)] || '';
  return (whole || !f ? String(whole) : '') + f + mark;
}
export const rodKey = len => 'ROD' + len.toFixed(1).padStart(4, '0');
const uid = () => 't' + Math.random().toString(36).slice(2, 9);
const norm = s => String(s || '').trim().toLowerCase();

/* ---------- lookups ---------- */
export const typeInfo = key => TYPES[key];
export const baseOptions = type => (TYPES[type] && TYPES[type].bases ? BASES[TYPES[type].bases] : []);
export function baseOption(t) {
  const opts = baseOptions(t.type);
  return opts.find(b => b.id === t.base) || opts[0];
}
export const catalogList = type => (type === 'resin' ? RESINS : type === 'cup' ? CUP_TROPHIES : []);
export function catalogProduct(t) {
  if (!t.catalog) return null;
  return catalogList(t.type).find(p => p.key === t.catalog.product) || null;
}
export function catalogVariant(t) {
  const p = catalogProduct(t);
  return p ? p.variants.find(v => v.sku === t.catalog.sku) || null : null;
}

/* Find a figure/trim by name. Exact match first, then a unique partial match. */
export function findItem(name, pool) {
  const q = norm(name);
  if (!q) return { item: null };
  const exact = pool.find(i => norm(i.name) === q);
  if (exact) return { item: exact };
  const alias = Object.entries(ALIASES).find(([a]) => norm(a) === q);
  if (alias) { const hit = pool.find(i => i.name === alias[1]); if (hit) return { item: hit }; }
  const partial = pool.filter(i => norm(i.name).includes(q) || q.includes(norm(i.name)));
  if (partial.length === 1) return { item: partial[0] };
  const words = q.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = pool.map(i => ({ i, s: words.filter(w => norm(i.name).includes(w)).length }))
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  return { item: null, suggestions: (partial.length ? partial : scored.map(x => x.i)).slice(0, 6).map(i => i.name) };
}
export const MIDDLE_POOL = () => [...TRIMS, ...FIGURES];

/* ---------- new objects ---------- */
export function newOrder() {
  return { id: '', orderNo: '', customer: '', due: '', notes: '', customerNotes: '', quoteMessage: '', addons: [], rush: false, rate: null, discount: 0, trophies: [] };
}
export function newTrophy(type = 'col2') {
  const T = TYPES[type];
  const t = {
    id: uid(), label: '', type, qty: 1,
    base: T.bases ? BASES[T.bases][BASES[T.bases].length > 2 ? 2 : 0].id : '',
    color: 'Gold',
    height: T.posts === 1 ? RULES.defaultHeight.single : RULES.defaultHeight.multi,
    lower: RULES.defaultHeight.tierLower, upper: RULES.defaultHeight.tierUpper,
    riser: 'cup', riserSize: 'auto',
    figure: null, trim: null, year: new Date().getFullYear(),
    middle: null, middleRiser: 'auto',
    risers: {}, insert: { type: 'mylar', art: '' }, extraLabor: 0, riserHeight: null, priceEach: null, trimHeight: null, customerNotes: '',
    catalog: null, plates: [['', '', '']], extras: [], notes: ''
  };
  return t;
}

/* ---------- normalize & validate one trophy ---------- */
function clampHalf(v, [lo, hi], label, warn) {
  let n = Math.round(Number(v) * 2) / 2;
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < lo || n > hi) { warn.push(`${label} ${v}″ is outside ${lo}–${hi}″, so it was set to ${inch(Math.min(hi, Math.max(lo, n)))}.`); n = Math.min(hi, Math.max(lo, n)); }
  return n;
}
function clampInt(v, [lo, hi], label, warn) {
  let n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n < lo || n > hi) { warn.push(`${label} ${v}″ is outside ${lo}–${hi}″, so it was set to ${Math.min(hi, Math.max(lo, n))}″.`); n = Math.min(hi, Math.max(lo, n)); }
  else if (n !== Number(v)) warn.push(`${label} rounded to ${n}″ (whole inches only).`);
  return n;
}
function refOf(v) {
  if (!v) return null;
  if (typeof v === 'string') return { name: v };
  if (v.custom) {
    const c = { name: String(v.custom.name || 'Custom item'), sku: String(v.custom.sku || ''), img: v.custom.img || '' };
    if (+v.custom.cost >= 0 && v.custom.cost !== '' && v.custom.cost != null) c.cost = Math.round(+v.custom.cost * 100) / 100;
    if (+v.custom.height > 0) c.height = +v.custom.height;
    if (v.custom.mine) c.mine = String(v.custom.mine);
    return { custom: c };
  }
  if (v.name) return { name: String(v.name) };
  return null;
}

export function normalizeTrophy(raw, idx = 0) {
  const warnings = [], errors = [];
  const where = `Trophy ${idx + 1}`;
  const type = TYPES[raw.type] ? raw.type : null;
  if (!type) { errors.push(`${where}: unknown type "${raw.type}". Use one of: ${Object.keys(TYPES).join(', ')}.`); return { t: null, warnings, errors }; }
  const T = TYPES[type];
  const d = newTrophy(type);
  const t = { ...d, id: raw.id || d.id, label: String(raw.label || ''), notes: String(raw.notes || ''), customerNotes: String(raw.customerNotes || '') };
  t.qty = Math.max(1, Math.round(Number(raw.qty) || 1));
  t.extraLabor = Math.max(0, Math.round(Number(raw.extraLabor) || 0));   // minutes, charged at the shop rate
  t.priceEach = +raw.priceEach > 0 ? Math.round(+raw.priceEach * 100) / 100 : null;   // set price that overrides the formula
  t.year = Math.round(Number(raw.year)) || d.year;

  if (T.catalog) {
    const c = raw.catalog || {};
    const list = catalogList(type);
    let p = list.find(x => x.key === c.product) || list.find(x => norm(x.title) === norm(c.product));
    if (!p && c.sku) p = list.find(x => x.variants.some(v => norm(v.sku) === norm(c.sku)));
    if (!p) errors.push(`${where}: pick a ${T.name.toLowerCase()} (catalog.product).`);
    else {
      const v = p.variants.find(x => norm(x.sku) === norm(c.sku));
      if (!v) errors.push(`${where}: choose a size/option for "${p.title}" (catalog.sku). Options: ${p.variants.map(x => x.sku + ' ' + x.opts.join(' / ')).slice(0, 8).join('; ')}`);
      t.catalog = { product: p.key, sku: v ? v.sku : '' };
    }
  } else {
    const opts = baseOptions(type);
    const b = opts.find(o => o.id === raw.base) || opts.find(o => norm(o.label).includes(norm(raw.base)) && raw.base);
    if (raw.base && !b) warnings.push(`${where}: base "${raw.base}" isn't offered for this type — using ${opts[0].label}.`);
    t.base = (b || opts.find(o => o.id === d.base) || opts[0]).id;

    if (T.posts > 0) {
      const col = Object.keys(COLUMNS).find(c => norm(c) === norm(raw.color));
      if (!col) warnings.push(`${where}: column color ${raw.color ? `"${raw.color}" not found` : 'not set'} — using Gold.`);
      t.color = col || 'Gold';
    }
    if (T.tiers === 1) {
      const range = T.posts === 1 ? RULES.heights.single : RULES.heights.multi;
      t.height = clampInt(raw.height ?? d.height, range, `${where}: column height`, warnings) ?? d.height;
    }
    if (T.tiers === 2) {
      t.lower = clampInt(raw.lower ?? d.lower, RULES.heights.tierLower, `${where}: bottom columns`, warnings) ?? d.lower;
      t.upper = clampInt(raw.upper ?? d.upper, RULES.heights.tierUpper, `${where}: top columns`, warnings) ?? d.upper;
      if (raw.middleRiser && raw.middleRiser !== 'auto')
        t.middleRiser = clampHalf(raw.middleRiser, RULES.heights.middleRiser, `${where}: middle riser`, warnings) ?? 'auto';
      const m = refOf(raw.middle);
      if (m && m.name) {
        const r = findItem(m.name, MIDDLE_POOL());
        if (r.item) t.middle = { name: r.item.name };
        else { t.middle = { custom: { name: m.name, sku: '', img: '' } }; warnings.push(`${where}: middle item "${m.name}" isn't in the list — added as a custom item.`); }
      } else t.middle = m;
      if (!t.middle) warnings.push(`${where}: no middle item chosen.`);
    }
    if (T.posts >= 2) {
      t.riser = raw.riser === 'column' ? 'column' : 'cup';
      const rs = String(raw.riserSize ?? 'auto').replace(/[^0-9a-z]/gi, '');
      t.riserSize = RISER_CUPS[rs] ? rs : RISER_CUPS['cup' + rs] ? 'cup' + rs : 'auto';
      if (t.riser === 'column' && +raw.riserHeight > 0) {
        const [lo, hi] = RULES.heights.topRiser;
        const h = Math.round(+raw.riserHeight * 2) / 2;
        if (h < lo || h > hi) warnings.push(`${where}: column riser ${raw.riserHeight}″ is outside ${lo}–${hi}″.`);
        t.riserHeight = Math.min(hi, Math.max(lo, h));
      } else t.riserHeight = null;
    }
    // top figure
    const f = refOf(raw.figure);
    if (f && f.name) {
      const r = findItem(f.name, FIGURES);
      if (r.item) t.figure = { name: r.item.name };
      else errors.push(`${where}: figure "${f.name}" not found.${r.suggestions && r.suggestions.length ? ' Did you mean: ' + r.suggestions.join(', ') + '?' : ''}`);
    } else if (f && f.custom) t.figure = f;
    if (!t.figure) warnings.push(`${where}: no top figure chosen.`);
    // trim
    if (type === 'col1trim' || T.posts >= 2) {
      const tr = refOf(raw.trim);
      if (tr && tr.name && norm(tr.name) !== 'none') {
        const r = findItem(tr.name, TRIMS);
        if (r.item) {
          t.trim = { name: r.item.name };
          if (r.item.multiOnly && type === 'col1trim') warnings.push(`${where}: ${r.item.name} is normally used on 2+ column trophies.`);
        } else errors.push(`${where}: trim "${tr.name}" not found.${r.suggestions && r.suggestions.length ? ' Did you mean: ' + r.suggestions.join(', ') + '?' : ''}`);
      } else if (tr && tr.custom) t.trim = tr;
      if (type === 'col1trim' && !t.trim) warnings.push(`${where}: no trim chosen.`);
    }
  }
  // warn about anything JDS has stopped making
  [['figure', 'top figure'], ['trim', 'trim'], ['middle', 'middle item']].forEach(([k, label]) => {
    const info = t[k] && itemInfo(t[k]);
    if (info && info.discontinued) warnings.push(`${where}: ${info.name} is discontinued at JDS — pick another ${label}.`);
  });

  // JDS risers standing in for a column or cup: { top, middle, trim, main } → SKU
  t.risers = {};
  if (!T.catalog && raw.risers && typeof raw.risers === 'object') {
    const slots = { top: T.posts >= 2, middle: T.tiers === 2, trim: T.posts >= 2 && !!t.trim, main: T.posts === 1 };
    Object.entries(raw.risers).forEach(([slot, v]) => {
      if (!v) return;
      const sku = String(typeof v === 'object' ? v.sku : v).trim();
      if (!slots[slot]) { warnings.push(`${where}: a riser in the "${slot}" spot doesn't apply to this trophy — ignored.`); return; }
      if (sku === 'none') { if (slot === 'trim' || slot === 'middle') t.risers[slot] = 'none'; return; }   // stands straight on the base/lid
      if (!jds(sku)) warnings.push(`${where}: riser ${sku} isn't in the JDS list — check the SKU.`);
      t.risers[slot] = sku;
    });
  }
  // height of the column under the trim on the base (blank = the usual 4/5/6″)
  t.trimHeight = (T.posts >= 2 && +raw.trimHeight > 0) ? clampHalf(raw.trimHeight, RULES.heights.trimColumn, `${where}: trim column`, warnings) : null;
  // 2″ inserts for any insert holder on the trophy
  const ins = raw.insert || {};
  t.insert = { type: INSERT_TYPES[ins.type] ? ins.type : 'mylar', art: String(ins.art || '') };

  // plates: one per trophy, 3 lines each
  const plates = Array.isArray(raw.plates) ? raw.plates.map(p => Array.isArray(p) ? p : [p && p.line1, p && p.line2, p && p.line3]) : [];
  t.plates = Array.from({ length: t.qty }, (_, i) => [0, 1, 2].map(j => String((plates[i] || [])[j] || '')));
  if (plates.length > t.qty) warnings.push(`${where}: ${plates.length} plates given for ${t.qty} trophies — extra plates dropped.`);
  t.extras = (Array.isArray(raw.extras) ? raw.extras : []).filter(e => e && e.name)
    .map(e => ({ name: String(e.name), sku: String(e.sku || ''), qty: Math.max(1, Math.round(Number(e.qty) || 1)) }));
  return { t, warnings, errors };
}

/* Add-on items: anything that isn't a trophy (extra plates, plaques…), priced by you.
   { id, name, desc, qty, price (each, what the customer pays), img (small picture, optional) } */
export function newAddon() { return { id: 'a' + Math.random().toString(36).slice(2, 9), name: '', desc: '', qty: 1, price: 0, img: '' }; }
function normalizeAddons(list) {
  return (Array.isArray(list) ? list : []).filter(a => a && typeof a === 'object').map(a => ({
    id: String(a.id || newAddon().id), name: String(a.name || ''), desc: String(a.desc || ''),
    qty: Math.max(0, Math.round(+a.qty || 0)), price: Math.max(0, Math.round((+a.price || 0) * 100) / 100),
    img: typeof a.img === 'string' && (a.img.startsWith('data:image/') || a.img.startsWith('https://')) ? a.img : ''
  }));
}
export function normalizeOrder(raw) {
  const o = { ...newOrder(), id: raw.id || '', orderNo: String(raw.orderNo || ''), customer: String(raw.customer || ''),
    due: String(raw.due || ''), notes: String(raw.notes || ''), customerNotes: String(raw.customerNotes || ''), quoteMessage: String(raw.quoteMessage || ''), addons: normalizeAddons(raw.addons), rush: !!raw.rush,
    rate: raw.rate != null && raw.rate !== '' && +raw.rate > 0 ? +raw.rate : null,
    discount: +raw.discount > 0 ? Math.min(100, +raw.discount) : 0, trophies: [] };
  const warnings = [], errors = [];
  (raw.trophies || []).forEach((rt, i) => {
    const r = normalizeTrophy(rt, i);
    warnings.push(...r.warnings); errors.push(...r.errors);
    if (r.t) o.trophies.push(r.t);
  });
  if (!o.trophies.length) errors.push('The order has no trophies.');
  return { order: o, warnings, errors };
}

/* ---------- item → part line ---------- */
function itemPart(ref, kind, year) {
  if (!ref) return null;
  if (ref.custom) {
    const j = ref.custom.sku ? jds(ref.custom.sku) : null;
    return { key: j ? j.sku : 'custom:' + norm(ref.custom.name) + ':' + ref.custom.sku, sku: ref.custom.sku, name: ref.custom.name, cat: kind,
      holder: j ? j.holder : /holder/i.test(ref.custom.name), cost: ref.custom.cost ?? null };
  }
  const pool = kind === 'figure' ? FIGURES : [...TRIMS, ...FIGURES];
  const item = pool.find(i => i.name === ref.name);
  if (!item) return { key: 'missing:' + ref.name, sku: '', name: ref.name, cat: kind };
  const isTrim = TRIMS.includes(item);
  const cat = isTrim ? 'trim' : 'figure';
  if (item.year) {
    const sku = (YEAR_TRIM_SKUS[item.name] || {})[year] || '';
    const name = item.name === 'Year (Full)' ? `2″ Gold "${year}" Ribbon Trim` : `${item.name} Trim — ${year}`;
    return { key: sku || 'year:' + item.name + ':' + year, sku, name, cat, holder: false };
  }
  const name = item.part || (item.name + (isTrim ? ' Trim' : ' Figure'));
  const holder = !!item.holder || /holder/i.test(item.name) || !!(item.sku && jds(item.sku) && jds(item.sku).holder);
  return { key: item.sku || cat + ':' + item.name, sku: item.sku || '', name, cat, holder };
}
export function itemInfo(ref) {
  if (!ref) return null;
  if (ref.custom) {
    const j = ref.custom.sku ? jds(ref.custom.sku) : null;
    return { name: ref.custom.name, url: ref.custom.img || (j && j.img) || '', scale: 1.3, custom: true, jds: !!j, height: ref.custom.height || (j ? j.height : null), holder: j ? j.holder : /holder/i.test(ref.custom.name) };
  }
  return [...FIGURES, ...TRIMS].find(i => i.name === ref.name) || null;
}
export const refSku = (ref, year) => { const p = itemPart(ref, 'trim', year); return p ? p.sku : ''; };
export const itemName = ref => (!ref ? '' : ref.custom ? ref.custom.name : ref.name);

/* ---------- bill of materials for ONE trophy (quantities per single trophy) ---------- */
export function riserFor(t) {
  const T = TYPES[t.type];
  if (T.posts < 2) return null;
  const key = t.riserSize !== 'auto' && RISER_CUPS[t.riserSize] ? t.riserSize
    : (T.tiers === 2 ? RULES.riserTwoTier : RULES.riserByPosts)[T.posts];
  return { key, ...RISER_CUPS[key] };
}
/* Column riser under the top figure: the height you set, or the cup's height */
export const columnRiserHeight = t => (t.riserHeight > 0 ? t.riserHeight : (riserFor(t) || {}).height || 6);
export const middleRiserHeight = t => (t.middleRiser === 'auto' || !t.middleRiser ? RULES.middleRiserFromUpper(t.upper) : t.middleRiser);
export const trimColumnHeight = t => (t.trimHeight > 0 ? t.trimHeight : RULES.trimColumnByPosts[TYPES[t.type].posts] || 0);
export const trimColumnDefault = t => RULES.trimColumnByPosts[TYPES[t.type].posts] || 0;

export function trophyBOM(t) {
  const lines = new Map();
  const posts = [];     // assembly notes, one per post type
  const cuts = [];      // { color, len, count }
  const warnings = [];
  const add = (key, qty, meta) => {
    if (!qty) return;
    const cur = lines.get(key);
    if (cur) cur.qty += qty;
    else lines.set(key, { key, qty, seq: lines.size, ...meta });
  };
  const part = (sku, qty) => {
    const p = PARTS[sku] || { cat: 'extra', name: (jds(sku) || {}).name || sku };
    add(sku, qty, { sku: sku.startsWith('_') ? '' : sku, name: p.name, cat: p.cat });
  };
  const T = TYPES[t.type];

  if (T.catalog) {
    const p = catalogProduct(t), v = catalogVariant(t);
    if (p && v) add(v.sku, 1, { sku: v.sku, name: `${p.title} — ${v.opts.join(', ')}`, cat: 'catalog' });
    (t.extras || []).forEach(e => add('extra:' + (e.sku || e.name), e.qty, { sku: e.sku, name: e.name, cat: 'extra' }));
    return finish();
  }

  const base = baseOption(t);
  const wood = base.material === 'wood';
  const rodLen = len => len + (wood ? RULES.woodRodExtra : 0);
  const colInfo = COLUMNS[t.color] || COLUMNS.Gold;
  const column = (len, n) => {
    cuts.push({ color: t.color, len, count: n });
    add(`col:${t.color}:${len}`, n, { sku: colInfo.sku, name: `${inch(len)} ${colInfo.label} column`, cat: 'column', color: t.color, len });
    part('H23G', 2 * n);
  };
  const rod = (len, n) => {
    const over = len > RULES.maxStockRod;
    if (over) warnings.push(`Needs ${inch(len)} rods, longer than the ${RULES.maxStockRod}″ you stock — join two rods with a ferrule.`);
    add(rodKey(len), n, { sku: over ? '' : rodKey(len), name: `${inch(len)} Rod`, cat: 'rod', len, note: over ? 'join 2 rods + ferrule' : '' });
  };
  let holders = 0;
  const item = (ref, kind, label) => {
    const p = itemPart(ref, kind, t.year);
    if (!p) { warnings.push(`No ${label} chosen.`); return; }
    add(p.key, 1, { sku: p.sku, name: p.name, cat: p.cat, ...(p.cost != null ? { cost: p.cost } : {}) });
    if (p.holder) holders++;
  };

  /* A spot under a figure/trim can be a column (default), or a JDS riser standing in for it.
     Risers get a rod the riser's height (rounded to ½″, like a cup), no check rings. */
  const riserPart = slot => {
    const sku = t.risers && t.risers[slot] !== 'none' && t.risers[slot];
    const j = sku ? jds(sku) : null;
    return sku ? { sku, name: j ? j.name : sku, height: (j && j.height) || 5, holder: !!(j && j.holder) } : null;
  };
  const support = (slot, colLen, topName, under) => {
    if (standsBare(t, slot)) {
      part('HEX2', 1);
      return { title: `straight on the ${under} (no column or riser)`, detail: `${topName}’s stud goes through the ${under} · hexnut underneath`, height: 0 };
    }
    const r = riserPart(slot);
    if (r) {
      const rl = Math.max(1, Math.round(r.height * 2) / 2);
      add(r.sku, 1, { sku: r.sku, name: r.name, cat: 'riser' });
      if (r.holder) holders++;
      rod(rl, 1); part('FER125S', 1); part('HEX2', 1);
      return { title: `${r.name} (${r.sku})`, detail: `${inch(rl)} rod through the riser · ${topName} + ferrule on top · hexnut under the ${under}`, height: r.height };
    }
    column(colLen, 1); rod(rodLen(colLen), 1); part('FER125S', 1); part('HEX2', 1);
    return { title: `${inch(colLen)} column`, detail: `${inch(rodLen(colLen))} rod · ${topName} + ferrule on top · hexnut under the ${under}`, height: colLen };
  };

  base.parts.forEach(p => part(p, 1));
  if (T.tiers === 2) part(base.extraLid, 1);

  const riser = (lidWord) => {
    const figName = itemName(t.figure) || 'top figure';
    if (riserPart('top')) {
      const s = support('top', 0, figName, lidWord);
      posts.push({ count: 1, title: `Riser: ${s.title}`, detail: s.detail + ' (replaces the cup)' });
    } else if (t.riser === 'column') {
      const h = columnRiserHeight(t);
      const s = support('top', h, figName, lidWord);
      posts.push({ count: 1, title: `${inch(h)} column riser (replaces the cup)`, detail: s.detail });
    } else {
      const r = riserFor(t);
      part(r.cup, 1); part(r.lid, 1); rod(r.rod, 1); part('FER125S', 1); part('HEX2', 1);
      posts.push({ count: 1, title: `${r.label} riser (${r.cup} + ${r.lid})`,
        detail: `${inch(r.rod)} rod through the cup · ${figName} + ferrule on top · hexnut under the ${lidWord}` });
    }
    item(t.figure, 'figure', 'top figure');
  };
  const baseTrim = () => {
    if (!t.trim) return;
    const s = support('trim', trimColumnHeight(t), itemName(t.trim), 'base');
    item(t.trim, 'trim', 'trim');
    posts.push({ count: 1, title: `Trim on the base: ${s.title}`, detail: s.detail });
  };

  switch (t.type) {
    case 'fob':
      item(t.figure, 'figure', 'figure'); part('HEX2', 1);
      posts.push({ count: 1, title: 'Figure', detail: 'Figure’s stud goes through the base · hexnut underneath' });
      break;
    case 'col1':
    case 'col1trim': {
      const s = support('main', t.height, itemName(t.figure) || 'figure', 'base');
      item(t.figure, 'figure', 'top figure');
      posts.push({ count: 1, title: s.title, detail: s.detail });
      if (t.type === 'col1trim') {
        item(t.trim, 'trim', 'trim'); part('HEX2', 1);
        posts.push({ count: 1, title: 'Trim (no column)', detail: 'Trim’s stud goes straight through the base · hexnut underneath' });
      }
      break;
    }
    default: {
      const N = T.posts;
      if (T.tiers === 1) {
        column(t.height, N); rod(rodLen(t.height), N);
        part('GME4', N); part('FER125S', N); part('HEX2', N);
        posts.push({ count: N, title: `${inch(t.height)} main columns`,
          detail: `${inch(rodLen(t.height))} rod each · eagle + ferrule on the lid · hexnut under the base` });
        riser('lid');
      } else {
        column(t.lower, N); rod(rodLen(t.lower), N); part('HEX2', N);
        column(t.upper, N); rod(rodLen(t.upper), N);
        part('FER125S', N);            // joins bottom rod to top rod through the middle lid
        part('GME4', N); part('FER125S', N);
        posts.push({ count: N, title: `${inch(t.lower)} bottom columns`,
          detail: `${inch(rodLen(t.lower))} rod each · hexnut under the base · ferrule through the middle lid joins it to the top rod` });
        posts.push({ count: N, title: `${inch(t.upper)} top columns`,
          detail: `${inch(rodLen(t.upper))} rod each · screws into that joining ferrule · eagle + ferrule on the top lid` });
        riser('top lid');
        const s = support('middle', middleRiserHeight(t), itemName(t.middle) || 'middle item', 'middle lid');
        item(t.middle, 'trim', 'middle item');
        posts.push({ count: 1, title: `Middle: ${s.title}`, detail: s.detail });
      }
      baseTrim();
    }
  }
  if (holders) {
    const ty = (t.insert && INSERT_TYPES[t.insert.type]) ? t.insert.type : 'mylar';
    add('insert:' + ty, holders, { sku: '', name: `2″ round insert — ${INSERT_TYPES[ty].label}`, cat: 'insert', insertType: ty, note: t.insert && t.insert.art ? t.insert.art : '' });
  }
  (t.extras || []).forEach(e => add('extra:' + (e.sku || e.name), e.qty, { sku: e.sku, name: e.name, cat: 'extra' }));
  return finish();

  function finish() {
    const order = Object.fromEntries(CATEGORY_ORDER.map(([k], i) => [k, i]));
    const list = [...lines.values()].sort((a, b) =>
      (order[a.cat] ?? 99) - (order[b.cat] ?? 99) || (b.len || 0) - (a.len || 0) || a.seq - b.seq);
    return { lines: list, posts, cuts, warnings, inserts: typeof holders === 'number' ? holders : 0 };
  }
}

/* ---------- column cut plan ----------
   Packs cuts into as few 45″ tubes as possible. Works in ⅛″ steps, counts ⅛″ kerf
   per cut (the last piece on a tube needs no kerf past the end). Uses an exact
   search for normal-sized orders and a greedy packing if an order is huge. */
function packTubes(items /* [{len, n}] longest first */) {
  const E = 8, kerf = Math.round(RULES.kerf * E), cap = Math.round(RULES.tubeLength * E) + kerf;
  const size = items.map(x => Math.round(x.len * E) + kerf);
  const total = items.reduce((s, x, i) => s + x.n * size[i], 0);
  const lower = Math.ceil(total / cap);

  // maximal patterns that include the longest piece still waiting
  function patterns(counts) {
    const first = counts.findIndex(n => n > 0);
    const out = [], pick = new Array(counts.length).fill(0);
    pick[first] = 1;
    (function rec(i, room) {
      if (i === counts.length) {
        if (counts.every((n, j) => n - pick[j] === 0 || size[j] > room)) out.push(pick.slice());
        return;
      }
      const have = counts[i] - pick[i];
      for (let k = Math.min(have, Math.floor(room / size[i])); k >= 0; k--) {
        pick[i] += k; rec(i + 1, room - k * size[i]); pick[i] -= k;
      }
    })(0, cap - size[first]);
    return out;
  }
  // greedy fallback: fill the fullest pattern each time
  function greedy(counts) {
    const res = []; counts = counts.slice();
    while (counts.some(n => n > 0)) {
      const ps = patterns(counts);
      const p = ps.reduce((a, b) => (b.reduce((s, k, i) => s + k * size[i], 0) > a.reduce((s, k, i) => s + k * size[i], 0) ? b : a));
      res.push(p); p.forEach((k, i) => { counts[i] -= k; });
    }
    return res;
  }
  const start = items.map(x => x.n);
  let best = greedy(start);
  if (best.length > lower) {
    // exact search with memo; stops a branch once it hits that branch's lower bound
    const fill = p => p.reduce((s, k, i) => s + k * size[i], 0);
    const memo = new Map(); let budget = 40000;
    const solve = (counts, remaining) => {
      if (remaining === 0) return [];
      const key = counts.join(',');
      if (memo.has(key)) return memo.get(key);
      if (--budget < 0) return null;
      const floor = Math.ceil(remaining / cap);
      let here = null;
      for (const p of patterns(counts).sort((a, b) => fill(b) - fill(a))) {
        const rest = solve(counts.map((n, i) => n - p[i]), remaining - fill(p));
        if (rest && (!here || rest.length + 1 < here.length)) here = [p, ...rest];
        if ((here && here.length === floor) || budget < 0) break;
      }
      memo.set(key, here);
      return here;
    };
    const exact = solve(start, total);
    if (exact && exact.length < best.length) best = exact;
  }
  return best.map(p => {
    const cuts = p.flatMap((k, i) => Array(k).fill(items[i].len));
    const used = cuts.reduce((s, l) => s + l + RULES.kerf, 0);
    return { cuts, left: Math.max(0, RULES.tubeLength - used) };
  }).sort((a, b) => a.left - b.left);
}

export function cutPlan(pieces) {
  const byColor = {};
  pieces.forEach(p => { byColor[p.color] = byColor[p.color] || {}; byColor[p.color][p.len] = (byColor[p.color][p.len] || 0) + p.count; });
  return Object.entries(byColor).map(([color, counts]) => {
    const items = Object.entries(counts).map(([len, n]) => ({ len: +len, n })).sort((a, b) => b.len - a.len);
    const tooLong = items.filter(x => x.len > RULES.tubeLength);
    const tubes = packTubes(items.filter(x => x.len <= RULES.tubeLength));
    tooLong.forEach(x => { for (let i = 0; i < x.n; i++) tubes.push({ cuts: [x.len], left: 0, over: true }); });
    return { color, info: COLUMNS[color] || COLUMNS.Gold, tubes, pieces: items.map(x => ({ len: x.len, count: x.n })) };
  });
}

/* ---------- master list for a whole order ---------- */
export function orderBOM(order) {
  const master = new Map();
  const pieces = [];
  const trophies = order.trophies.map(t => {
    const bom = trophyBOM(t);
    bom.lines.forEach(l => {
      if (l.cat === 'column') return;             // columns become tubes below
      const cur = master.get(l.key);
      if (cur) cur.qty += l.qty * t.qty;
      else master.set(l.key, { ...l, qty: l.qty * t.qty, seq: master.size });
    });
    bom.cuts.forEach(c => pieces.push({ ...c, count: c.count * t.qty }));
    return { t, bom };
  });
  (order.addons || []).forEach(a => {
    if (!a.name || !(a.qty > 0)) return;
    master.set('addon:' + a.id, { key: 'addon:' + a.id, qty: a.qty, sku: '', cat: 'addon', seq: master.size,
      name: a.name + (a.desc ? ' — ' + a.desc : '') });
  });
  const cuts = cutPlan(pieces);
  cuts.forEach(c => master.set('tube:' + c.color, {
    key: 'tube:' + c.color, qty: c.tubes.length, sku: c.info.sku, cat: 'column', seq: master.size,
    name: `${c.info.label} column — ${RULES.tubeLength}″ tube${c.tubes.length > 1 ? 's' : ''}`
  }));
  const order_ = Object.fromEntries(CATEGORY_ORDER.map(([k], i) => [k, i]));
  const lines = [...master.values()].sort((a, b) =>
    (order_[a.cat] ?? 99) - (order_[b.cat] ?? 99) || (b.len || 0) - (a.len || 0) || a.seq - b.seq);
  const groups = CATEGORY_ORDER.map(([cat, title]) => ({ cat, title, lines: lines.filter(l => l.cat === cat) })).filter(g => g.lines.length);
  const warnings = [...new Set(trophies.flatMap(x => x.bom.warnings))];
  const count = order.trophies.reduce((s, t) => s + t.qty, 0);
  return { trophies, lines, groups, cuts, warnings, count };
}

/* ---------- cost (owner view only) ---------- */
/* Shop rate for an order: the rate typed on the order, else the default; × rush multiplier on rush jobs */
export function shopRate(order = {}) {
  return order.rate != null && order.rate > 0 ? order.rate : RULES.shopRatePerHour;
}
/* Round up to the next .99 — $9.36 → $9.99, $9.99 stays, $10.00 → $10.99 */
export function roundUp99(n) {
  if (!(n > 0)) return 0;
  return Math.round((Math.ceil(Math.round((n + 0.01) * 100) / 100) - 0.01) * 100) / 100;
}
export function lineCost(l) {
  if (l.cat === 'column') {
    const c = COLUMNS[l.color] || {};
    const tube = c.cost ?? jdsCost(c.sku);
    return tube != null ? tube / RULES.tubeLength * l.len : null;
  }
  if (l.cat === 'rod') return ROD_COSTS[l.len] ?? jdsCost(rodKey(l.len));
  if (l.cat === 'insert') return RULES.insertCost[l.insertType] ?? 0;
  if (l.cost != null) return l.cost;                       // a custom figure's own cost
  return (PARTS[l.key] || {}).cost ?? (l.sku ? jdsCost(l.sku) : null);
}
/* One trophy: parts cost and price.
   Price each = parts × markup, plus any extra labor you add (minutes × shop rate, not marked up),
   plus the rush surcharge on rush orders — rounded up to the next .99.
   Build minutes are a time estimate only. */
export function trophyCost(t, order = {}) {
  const { lines } = trophyBOM(t);
  let material = 0; const missing = [];
  lines.forEach(l => { const c = lineCost(l); if (c == null) missing.push(l.name); else material += c * l.qty; });
  const extraMinutes = +t.extraLabor || 0;
  const labor = extraMinutes / 60 * shopRate(order);
  const base = material * RULES.markup + labor;
  const rush = order.rush ? base * (RULES.rushPercent || 0) / 100 : 0;
  const formula = roundUp99(base + rush);
  const set = t.priceEach > 0 ? t.priceEach : null;           // a price you've agreed with this customer
  return { material, markup: RULES.markup, labor, extraMinutes, rush: set ? 0 : rush, formula, custom: !!set,
    price: set ?? formula, minutes: RULES.laborMinutes[t.type] ?? null, missing };
}
export function orderCost(order) {
  let material = 0, subtotal = 0, minutes = 0, timed = true;
  const missing = new Set();
  const per = order.trophies.map(t => {
    const c = trophyCost(t, order);
    material += c.material * t.qty;
    subtotal += c.price * t.qty;
    if (c.minutes == null) timed = false; else minutes += (c.minutes + c.extraMinutes) * t.qty;
    c.missing.forEach(m => missing.add(m));
    return { t, ...c };
  });
  const addons = (order.addons || []).filter(a => a.name && a.qty > 0).map(a => ({ ...a, total: Math.round(a.qty * a.price * 100) / 100 }));
  const addonsTotal = addons.reduce((s, a) => s + a.total, 0);
  subtotal += addonsTotal;
  const discount = order.discount > 0 ? Math.round(subtotal * order.discount) / 100 : 0;
  return { material, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100,
    minutes, timed, missing: [...missing], per, addons, addonsTotal };
}

/* ---------- human-readable spec ---------- */
/* JDS riser standing in a spot, if any: { sku, name, height } */
/* Nothing under it: the trim/item mounts straight to the base or lid */
export const standsBare = (t, slot) => !!(t.risers && t.risers[slot] === 'none');
export function riserIn(t, slot) {
  const sku = t.risers && t.risers[slot];
  if (!sku || sku === 'none') return null;
  const j = jds(sku);
  return { sku, name: j ? j.name : sku, height: (j && j.height) || 5, img: j ? j.img : '', holder: !!(j && j.holder) };
}
export function trophyInserts(t) { return trophyBOM(t).inserts || 0; }

export function specRows(t) {
  const T = TYPES[t.type], rows = [['Type', T.name]];
  const on = (slot, colLen) => { if (standsBare(t, slot)) return 'straight on the ' + (slot === 'middle' ? 'lid' : 'base'); const r = riserIn(t, slot); return r ? `on ${r.name} (${r.sku})` : `on ${inch(colLen)} column`; };
  if (T.catalog) {
    const p = catalogProduct(t), v = catalogVariant(t);
    rows.push(['Item', p ? p.title : '—']);
    if (p && v) p.optNames.forEach((n, i) => rows.push([n, v.opts[i]]));
    rows.push(['SKU', v ? v.sku : '—']);
  } else {
    rows.push(['Base', baseOption(t).label]);
    const main = riserIn(t, 'main');
    if (T.posts && !(T.posts === 1 && main)) rows.push(['Column color', t.color]);
    if (T.posts === 1) rows.push(main ? ['Riser', `${main.name} (${main.sku})`] : ['Column height', inch(t.height)]);
    else if (T.tiers === 1) rows.push(['Column height', inch(t.height)]);
    if (T.tiers === 2) { rows.push(['Bottom columns', inch(t.lower)]); rows.push(['Top columns', inch(t.upper)]); }
    if (T.posts >= 2) {
      const top = riserIn(t, 'top'), r = riserFor(t);
      rows.push(['Riser', top ? `${top.name} (${top.sku})` : t.riser === 'column' ? `${inch(columnRiserHeight(t))} column (replaces ${r.label})` : r.label]);
    }
    rows.push(['Top figure', itemName(t.figure) || '—']);
    if (T.tiers === 2) rows.push(['Middle item', (itemName(t.middle) || '—') + ' ' + on('middle', middleRiserHeight(t))]);
    if (t.type === 'col1trim' || T.posts >= 2) {
      const y = t.trim && itemInfo(t.trim) && itemInfo(t.trim).year ? ' ' + t.year : '';
      rows.push([T.tiers === 2 ? 'Bottom trim' : 'Trim', t.trim ? itemName(t.trim) + y + (T.posts >= 2 ? ' ' + on('trim', trimColumnHeight(t)) : ' (on base)') : 'None']);
    }
    const n = trophyInserts(t);
    if (n) rows.push(['2″ inserts', `${n} × ${INSERT_TYPES[t.insert.type].label}${t.insert.art ? ' — ' + t.insert.art : ''}`]);
  }
  rows.push(['Quantity', String(t.qty)]);
  return rows;
}
export function summary(t) {
  const T = TYPES[t.type];
  if (T.catalog) { const p = catalogProduct(t), v = catalogVariant(t); return p ? `${p.title}${v ? ' · ' + v.opts.join(' · ') : ''}` : T.name; }
  const bits = [];
  const main = riserIn(t, 'main');
  if (T.tiers === 1 && T.posts) bits.push(main && T.posts === 1 ? main.name : inch(t.height));
  if (T.tiers === 2) bits.push(`${inch(t.lower)} / ${inch(t.upper)}`);
  if (T.posts && !(T.posts === 1 && main)) bits.push(t.color);
  bits.push(baseOption(t).label.replace(/\s*\(.*\)$/, ''));
  let fig = itemName(t.figure) || 'no figure';
  if (T.posts >= 2) {
    const top = riserIn(t, 'top'), r = riserFor(t);
    fig += top ? ` on ${top.name}` : t.riser === 'column' ? ` on ${inch(columnRiserHeight(t))} column` : ` on ${r.label}`;
  }
  bits.push(fig);
  if (t.trim) bits.push(itemName(t.trim) + (itemInfo(t.trim) && itemInfo(t.trim).year ? ' ' + t.year : ''));
  if (T.tiers === 2 && t.middle) bits.push('middle: ' + itemName(t.middle));
  return bits.join(' · ');
}

/* ---------- plate CSV (same columns as buildatrophy.com, for EngraveLab) ---------- */
export function plateCSV(order) {
  const esc = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [['Trophy #', 'Plate #', 'Trophy Type', 'Column', 'Base', 'Height', 'Figure', 'Trim', 'Line 1', 'Line 2', 'Line 3']];
  order.trophies.forEach((t, ti) => {
    const T = TYPES[t.type];
    const height = T.tiers === 1 && T.posts ? inch(t.height, '"') : T.tiers === 2 ? `${inch(t.lower, '"')} / ${inch(t.upper, '"')}` : '';
    const base = T.catalog ? '' : baseOption(t).label;
    const fig = T.catalog ? (catalogProduct(t) || {}).title || '' : itemName(t.figure);
    t.plates.forEach((p, pi) => rows.push([ti + 1, pi + 1, T.name, T.posts ? t.color : '', base, height, fig, itemName(t.trim), p[0], p[1], p[2]]));
  });
  return rows.map(r => r.map(esc).join(',')).join('\r\n');
}

/* ---------- plain-text master list (for chat replies from the agent) ---------- */
export function masterText(order) {
  const m = orderBOM(order);
  const out = [`${order.orderNo ? 'Order ' + order.orderNo : 'Order'}${order.customer ? ' — ' + order.customer : ''}${order.due ? ' — due ' + order.due : ''}`,
    `${m.count} troph${m.count === 1 ? 'y' : 'ies'}, ${m.lines.length} pick-list lines`, ''];
  m.groups.forEach(g => {
    out.push(g.title);
    g.lines.forEach(l => out.push(`  [ ] ${String(l.qty).padStart(3)}  ${l.name}${l.sku ? '  (' + l.sku + ')' : ''}${l.note ? '  — ' + l.note : ''}`));
  });
  m.cuts.forEach(c => {
    out.push('', `Cut list — ${c.color} (${c.info.sku || 'SKU needed'})`);
    c.tubes.forEach((tb, i) => out.push(`  Tube ${i + 1}: ${tb.cuts.map(x => inch(x)).join(' + ')}  (${inch(tb.left)} left)`));
  });
  if (m.warnings.length) out.push('', 'Heads up:', ...m.warnings.map(w => '  • ' + w));
  return out.join('\n');
}
