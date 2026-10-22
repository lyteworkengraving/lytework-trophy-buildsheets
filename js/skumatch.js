/* ==========================================================================
   Match the builder's figures and trims to JDS SKUs, by eye.
   Your picture on the left, the JDS candidates on the right — click the one
   that matches. Choices are kept in this browser; "Download figures.js"
   writes the finished data file to drop into js/data/.
   ========================================================================== */
import { FIGURES, TRIMS, YEAR_TRIM_SKUS, SWATCHES, ART } from './data/figures.js';
import { JDS, jds } from './data/jds.js';
import { CROWN } from './brand.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const main = document.getElementById('main');
document.getElementById('crownPath').setAttribute('d', CROWN);
const KEY = 'tbs:skumatch';

const CANDIDATES = JDS.filter(i => ['ALLPS', 'RESPL', 'BADGE'].includes(i.cls) && i.img);
const targets = [...FIGURES.map(f => ({ ...f, kind: 'figure' })), ...TRIMS.map(t => ({ ...t, kind: 'trim' }))].filter(t => !t.discontinued).map(t => ({ ...t, url: t.url || (t.sku && jds(t.sku) ? jds(t.sku).img : '') }));
let picks = {};
try { picks = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* start over */ }
targets.forEach(t => { if (!picks[t.name] && t.sku) picks[t.name] = { sku: t.sku, part: t.part || '' }; });
let idx = targets.findIndex(t => !picks[t.name]);
if (idx < 0) idx = 0;
let query = '';

/* ---- ranking: rare words count for more, so "Falcon" beats "Baseball" ---- */
const STOP = new Set(['gold', 'silver', 'figure', 'trim', 'the', 'and', 'of', 'on', 'with', 'standup', 'plastic', 'relief', 'male', 'female']);
const SYN = { midnite: 'midnight', tball: 't', bsbl: 'baseball', sftbl: 'softball' };
const toks = s => String(s).toLowerCase().replace(/-/g, ' ').replace(/\d+\s*\d*\/?\d*\s*"?\s*\(?[hlw]?\)?/g, ' ')
  .split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w)).map(w => SYN[w] || w);
const df = new Map();
CANDIDATES.forEach(c => new Set(toks(c.name)).forEach(w => df.set(w, (df.get(w) || 0) + 1)));
const idf = w => Math.log(CANDIDATES.length / (1 + (df.get(w) || 0))) + 0.3;
function rank(target) {
  const q = toks(target.name + ' ' + (target.sub || target.category || ''));
  const den = q.reduce((s, w) => s + idf(w), 0) || 1;
  const hint = (target.url.match(/\/(FIG\d+|RP\d+\w*|TRM\d+\w*|PH\d+)[-_.]/i) || [])[1];
  return CANDIDATES.map(c => {
    const set = new Set(toks(c.name));
    let score = q.reduce((s, w) => s + (set.has(w) ? idf(w) : 0), 0) / den;
    if (hint && c.sku.toUpperCase() === hint.toUpperCase()) score += 2;      // SKU in the image file name
    return { c, score };
  }).sort((a, b) => b.score - a.score);
}

/* Matches save to the server's shop settings, so the app, the build sheets and the
   command-line tool all use them right away. This browser keeps a copy too. */
let status = '';
async function server(method, body, retried) {
  const res = await fetch('api/orders.php?settings=1', { method, headers: { 'Content-Type': 'application/json', 'X-Passcode': localStorage.getItem('tbs:pass') || '' }, body: body ? JSON.stringify(body) : undefined });
  if (!(res.headers.get('content-type') || '').includes('json')) throw new Error('no server');
  if (res.status === 401 && !retried) {
    const p = prompt('Shop passcode — needed once on this device to save matches:');
    if (p == null) throw new Error('No passcode — matches are saved on this device only.');
    localStorage.setItem('tbs:pass', p);
    return server(method, body, true);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'The server said no.');
  return data;
}
let timer;
const save = () => {
  localStorage.setItem(KEY, JSON.stringify(picks));
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try { await server('POST', { figureSkus: picks }); status = 'Saved — prices and pick lists use these now'; }
    catch (e) { status = e.message === 'no server' ? 'Saved on this device (no server here)' : e.message; }
    const el = document.getElementById('skStatus'); if (el) el.textContent = status;
  }, 800);
};
const done = () => targets.filter(t => picks[t.name]).length;

function draw() {
  const t = targets[idx];
  const ranked = query
    ? CANDIDATES.filter(c => (c.sku + ' ' + c.name).toLowerCase().includes(query.toLowerCase())).slice(0, 60).map(c => ({ c, score: 0 }))
    : rank(t).slice(0, 24);
  const pick = picks[t.name];
  const p = pick && jds(pick.sku);
  main.innerHTML = `
  <div class="sk-bar">
    <button class="btn btn-quiet btn-sm" data-go="-1">Previous</button>
    <button class="btn btn-quiet btn-sm" data-go="1">Next</button>
    <div class="sk-prog"><i style="width:${done() / targets.length * 100}%"></i></div>
    <span style="font-size:13.5px;color:var(--muted)">${done()} of ${targets.length} matched</span>
    <span id="skStatus" style="font-size:13px;color:var(--ok)">${status}</span>
    <button class="btn btn-quiet btn-sm" data-skip>Skip for now</button>
    ${pick ? '<button class="btn-text btn-danger" data-clear>Clear this one</button>' : ''}
  </div>
  <div class="sk-top">
    <div class="sk-mine">
      <div class="art"><img src="${esc(t.url)}" alt=""></div>
      <h2>${esc(t.name)}</h2>
      <p>${esc(t.sub || t.category)}${t.kind === 'trim' ? ' · trim' : ''}</p>
      ${p ? `<div class="sk-picked"><b>${esc(p.sku)}</b><br>${esc(p.name)}<br>${p.cost != null ? '$' + p.cost.toFixed(2) : 'no price'}</div>`
          : pick ? `<div class="sk-picked"><b>${esc(pick.sku)}</b></div>` : ''}
    </div>
    <div class="sk-side">
      <h3>${query ? 'Search results' : 'Closest JDS parts'} <small style="font-weight:400;color:var(--muted)">click the one that matches</small></h3>
      <input class="inp" id="q" type="search" placeholder="Search all ${CANDIDATES.length} JDS figures and trims by name or SKU" value="${esc(query)}" style="margin-bottom:10px">
      <div class="sk-grid">${ranked.map(({ c }) => `
        <button class="sk-cand" data-sku="${esc(c.sku)}" aria-pressed="${pick && pick.sku === c.sku}">
          <span class="im"><img src="${esc(c.img)}" alt="" loading="lazy"></span>
          <b>${esc(c.sku)}</b><span class="nm">${esc(c.name)}</span><small>${c.cost != null ? '$' + c.cost.toFixed(2) : 'no price'}${c.size ? ' · ' + esc(c.size) : ''}</small>
        </button>`).join('')}</div>
    </div>
  </div>
  <div class="sk-list">${targets.map((x, i) => `
    <button class="sk-chip" data-jump="${i}" data-done="${picks[x.name] ? 1 : 0}" style="${i === idx ? 'outline:2px solid var(--navy)' : ''}">
      <img src="${esc(x.url)}" alt="" loading="lazy"><span><b>${esc(x.name)}</b><small>${picks[x.name] ? esc(picks[x.name].sku) : 'not matched'}</small></span></button>`).join('')}</div>`;
  const q = document.getElementById('q');
  q.oninput = e => { query = e.target.value; const s = e.target.selectionStart; draw(); const n = document.getElementById('q'); n.focus(); n.setSelectionRange(s, s); };
}

main.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const t = targets[idx];
  if (b.dataset.sku) { picks[t.name] = { sku: b.dataset.sku, part: jds(b.dataset.sku).name }; save(); query = ''; idx = Math.min(idx + 1, targets.length - 1); return draw(); }
  if (b.dataset.go) { idx = Math.max(0, Math.min(targets.length - 1, idx + +b.dataset.go)); query = ''; return draw(); }
  if ('skip' in b.dataset) { idx = Math.min(idx + 1, targets.length - 1); query = ''; return draw(); }
  if ('clear' in b.dataset) { delete picks[t.name]; save(); return draw(); }
  if (b.dataset.jump) { idx = +b.dataset.jump; query = ''; return draw(); }
});
document.addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.id === 'q') return;
  if (e.key === 'ArrowRight') { idx = Math.min(idx + 1, targets.length - 1); draw(); }
  if (e.key === 'ArrowLeft') { idx = Math.max(0, idx - 1); draw(); }
});

/* ---- write the finished data file ---- */
function figuresFile() {
  const apply = arr => arr.map(x => {
    const p = picks[x.name];
    const o = { ...x };
    if (p) { o.sku = p.sku; o.part = p.part || ''; }
    return o;
  });
  const rows = a => a.map(o => '  ' + JSON.stringify(o) + ',').join('\n').replace(/,$/, '');
  return `/* ==========================================================================
   Figures & trims — names and artwork from buildatrophy.com, SKUs matched to the
   JDS parts export with skus.html. "part" is what prints on the parts list.
   ========================================================================== */

export const FIGURES = [
${rows(apply(FIGURES))}
];

/* year:true trims get the order year in their part name and use YEAR_TRIM_SKUS.
   multiOnly:true = only offered on 2+ column trophies (holders need a riser). */
export const TRIMS = [
${rows(apply(TRIMS))}
];

/* Year trims change SKU every year. Add next year's SKU when you order it. */
export const YEAR_TRIM_SKUS = ${JSON.stringify(YEAR_TRIM_SKUS, null, 2)};

/* Column colors + base textures (swatch images from the Shopify CDN) */
export const SWATCHES = ${JSON.stringify(SWATCHES, null, 2)};

export const ART = ${JSON.stringify(ART, null, 2)};
`;
}
document.getElementById('btnSave').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([figuresFile()], { type: 'text/javascript' }));
  a.download = 'figures.js'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
};
document.getElementById('btnCopy').onclick = async () => {
  await navigator.clipboard.writeText(JSON.stringify(picks, null, 2));
  document.getElementById('btnCopy').textContent = 'Copied';
  setTimeout(() => { document.getElementById('btnCopy').textContent = 'Copy as JSON'; }, 1500);
};
// pick up matches made on other devices, then show the first unmatched one
(async () => {
  try {
    const st = await server('GET');
    if (st && st.figureSkus) { picks = { ...st.figureSkus, ...picks }; localStorage.setItem(KEY, JSON.stringify(picks)); }
    const next = targets.findIndex(t => !picks[t.name]); if (next > -1) idx = next;
  } catch { /* this device only */ }
  draw();
})();
