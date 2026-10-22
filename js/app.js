/* ==========================================================================
   LyteWork Trophy Build Sheets — web app
   ========================================================================== */
import * as E from './engine.js';
import { renderTrophySVG } from './render.js';
import { encodeOrder } from './codec.js';
import { CROWN, fmtDate } from './brand.js';
import { measure, BOUNDS } from './artfit.js';
import { TYPES, RULES, RISER_CUPS, COLUMNS, INSERT_TYPES } from './data/catalog.js';
import { FIGURES, TRIMS, SWATCHES, ART } from './data/figures.js';
import { JDS, jds } from './data/jds.js';

/* Everything in the JDS export that's a figure, trim or holder — usable straight away,
   with its photo, SKU and your cost, even before it's in figures.js. */
const JDS_RISERS = JDS.filter(i => i.riser && i.img).map(i => ({ name: i.name, url: i.img, sku: i.sku, category: 'JDS', jds: true }));
const JDS_ITEMS = JDS.filter(i => ['ALLPS', 'RESPL', 'BADGE'].includes(i.cls) && i.img)
  .map(i => ({ name: i.name, url: i.img, sku: i.sku, category: 'JDS', jds: true }));

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = n => '$' + n.toFixed(2);
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
const DRAFT = 'tbs:draft', SHEET = 'tbs:sheet', PASS = 'tbs:pass', LOCAL = 'tbs:orders';
document.getElementById('crownPath').setAttribute('d', CROWN);

/* ---------------- state ---------------- */
let order = E.newOrder(), dirty = false, savedAt = '', editIdx = -1;

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
    if (d && d.order) { order = E.normalizeOrder(d.order).order; dirty = !!d.dirty; savedAt = d.savedAt || ''; }
  } catch { /* start fresh */ }
}
const persist = debounce(() => {
  try { localStorage.setItem(DRAFT, JSON.stringify({ order, dirty, savedAt })); }
  catch { toast('This order is too big to keep as a draft — save it to the server.'); }
}, 250);
function touch() { dirty = true; persist(); renderSaveState(); }

/* ---------------- storage: server (PHP / local serve) with a browser fallback ---------------- */
const store = {
  mode: null,
  async req(method, qs = '', body, retried, prompt = true) {
    let res;
    try {
      res = await fetch('api/orders.php' + qs, { method, headers: { 'Content-Type': 'application/json', 'X-Passcode': localStorage.getItem(PASS) || '' }, body: body ? JSON.stringify(body) : undefined });
    } catch { throw Object.assign(new Error('No connection to the server.'), { noServer: true }); }
    if (!(res.headers.get('content-type') || '').includes('json')) throw Object.assign(new Error('No saved-orders server here.'), { noServer: true });
    const data = await res.json();
    if (res.status === 401 && !retried && prompt) {
      const pass = await askPasscode(localStorage.getItem(PASS) ? 'That passcode didn’t work. Try again.' : '');
      if (pass == null) throw Object.assign(new Error('Passcode needed to save.'), { cancelled: true });
      localStorage.setItem(PASS, pass);
      return this.req(method, qs, body, true, true);
    }
    if (!res.ok) throw Object.assign(new Error(data.error || 'The server said no.'), { status: res.status });
    return data;
  },
  async detect() {
    if (this.mode) return this.mode;
    try { await this.req('GET', '?ping=1', null, false, false); this.mode = 'server'; }
    catch (e) { this.mode = e.noServer || e.status === 503 ? 'local' : 'server'; if (e.status === 503) toast(e.message); }
    return this.mode;
  },
  local() { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch { return {}; } },
  async list() {
    if (await this.detect() === 'server') return (await this.req('GET', '?list=1')).orders;
    return Object.values(this.local()).map(o => ({ id: o.id, orderNo: o.orderNo, customer: o.customer, due: o.due, updated: o.updated, designs: o.trophies.length, count: o.trophies.reduce((s, t) => s + t.qty, 0) }))
      .sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  },
  async get(id) { return (await this.detect()) === 'server' ? this.req('GET', '?id=' + encodeURIComponent(id)) : this.local()[id]; },
  async save(o) {
    if (await this.detect() === 'server') return this.req('POST', '', o);
    const all = this.local();
    const id = o.id || new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(16).slice(2, 10).padEnd(8, '0');
    const updated = new Date().toISOString();
    all[id] = { ...o, id, updated };
    localStorage.setItem(LOCAL, JSON.stringify(all));
    return { id, updated };
  },
  async del(id) {
    if (await this.detect() === 'server') return this.req('DELETE', '?id=' + encodeURIComponent(id));
    const all = this.local(); delete all[id]; localStorage.setItem(LOCAL, JSON.stringify(all));
  }
};

/* ---------------- small UI helpers ---------------- */
const layer = $('#layer');
function toast(msg, { action, onAction, ms = 3200 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = esc(msg) + (action ? ` <button class="btn-text" style="color:var(--gold-bright);margin-left:8px">${esc(action)}</button>` : '');
  document.querySelectorAll('.toast').forEach(t => t.remove());
  document.body.appendChild(el);
  if (action) el.querySelector('button').onclick = () => { el.remove(); onAction(); };
  setTimeout(() => el.remove(), ms);
}
function modal(html, { cls = 'dialog', onClose } = {}) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const box = document.createElement('div'); box.className = cls; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = html;
  const close = () => { scrim.remove(); box.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  scrim.onclick = close;
  document.addEventListener('keydown', onKey);
  layer.append(scrim, box);
  box.tabIndex = -1;
  (box.querySelector('[autofocus]') || box).focus();
  return { box, close };
}
function askPasscode(msg) {
  return new Promise(resolve => {
    let done = false;
    const m = modal(`<h3>Passcode</h3><p>${esc(msg || 'Enter the shop passcode to save and open orders. You only need to do this once on this device.')}</p>
      <input class="inp" type="password" id="pcIn" autocomplete="current-password" autofocus>
      <div class="row"><button class="btn btn-quiet" id="pcNo">Cancel</button><button class="btn btn-primary" id="pcGo">Continue</button></div>`,
      { onClose: () => { if (!done) resolve(null); } });
    const go = () => { done = true; const v = m.box.querySelector('#pcIn').value; m.close(); resolve(v); };
    m.box.querySelector('#pcGo').onclick = go;
    m.box.querySelector('#pcIn').onkeydown = e => { if (e.key === 'Enter') go(); };
    m.box.querySelector('#pcNo').onclick = () => m.close();
  });
}
function confirmBox(title, body, yes = 'Continue') {
  return new Promise(resolve => {
    let done = false;
    const m = modal(`<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="row"><button class="btn btn-quiet" id="cfNo">Cancel</button><button class="btn btn-primary" id="cfYes">${esc(yes)}</button></div>`,
      { onClose: () => { if (!done) resolve(false); } });
    m.box.querySelector('#cfYes').onclick = () => { done = true; m.close(); resolve(true); };
    m.box.querySelector('#cfNo').onclick = () => m.close();
  });
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const fileBase = () => [order.orderNo || new Date().toISOString().slice(0, 10), (order.customer || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 30)].filter(Boolean).join('_');

/* ---------------- order screen ---------------- */
const fNo = $('#fNo'), fCust = $('#fCust'), fDue = $('#fDue'), fNotes = $('#fNotes');
const fRush = $('#fRush'), fDisc = $('#fDisc');
function fillHeader() {
  fNo.value = order.orderNo; fCust.value = order.customer; fDue.value = order.due; fNotes.value = order.notes; $('#fCustNotes').value = order.customerNotes || ''; $('#fQuoteMsg').value = order.quoteMessage || ''; $('#fQuoteMsg').placeholder = RULES.quote.thanks || '';
  fRush.checked = !!order.rush; fDisc.value = order.discount || '';
  $('#rushPct').textContent = `+${RULES.rushPercent}% up-charge`;
}
fRush.addEventListener('change', () => { order.rush = fRush.checked; touch(); renderPick(); });
fDisc.addEventListener('input', () => { order.discount = +fDisc.value > 0 ? Math.min(100, +fDisc.value) : 0; touch(); renderPick(); });
/* If the page is an older copy without the Customer notes box (a cached index.html),
   add it here instead of failing — a stale page must never stop the whole app. */
if (!$('#fCustNotes') && $('#fNotes')) {
  $('#fNotes').closest('label').insertAdjacentHTML('afterend',
    '<label class="fld"><span>Customer notes <small class="fld-hint">from or for the customer</small></span><textarea id="fCustNotes" rows="2" placeholder="What the customer asked for, or what to tell them"></textarea></label>');
}
const fCustNotes = $('#fCustNotes');
if (!$('#fQuoteMsg') && fCustNotes) fCustNotes.closest('label').insertAdjacentHTML('afterend', '<label class="fld"><span>Message on the quote <small class="fld-hint">blank = your usual thank-you</small></span><input id="fQuoteMsg" autocomplete="off" placeholder="Thank you for the opportunity to make your awards."></label>');
const fQuoteMsg = $('#fQuoteMsg');
[[fNo, 'orderNo'], [fCust, 'customer'], [fDue, 'due'], [fNotes, 'notes'], [fCustNotes, 'customerNotes'], [fQuoteMsg, 'quoteMessage']].forEach(([el, k]) => el.addEventListener('input', () => { order[k] = el.value; touch(); }));

function renderSaveState() {
  const el = $('#saveState');
  const when = savedAt ? new Date(savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  el.className = 'save-state' + (dirty ? ' dirty' : '');
  el.innerHTML = dirty ? `<i></i>${order.id ? 'Changes not saved yet' : 'Not saved yet — your draft is kept on this device'}` : when ? `Saved ${esc(when)}` : 'New order';
}

const cleanNote = w => { const s = w.replace(/^Trophy \d+: /, ''); return s[0].toUpperCase() + s.slice(1); };
const trophyWarnings = (t, i) => E.normalizeTrophy(t, i).warnings.map(cleanNote);

function renderList() {
  const n = order.trophies.reduce((s, t) => s + t.qty, 0);
  $('#trophyCount').textContent = order.trophies.length ? `${n} total` : '';
  const list = $('#trophyList');
  if (!order.trophies.length) {
    list.innerHTML = `<div class="empty"><svg viewBox="0 0 5000 5000" aria-hidden="true"><path d="${CROWN}"/></svg><p>No trophies on this order yet.</p><button class="btn btn-accent" data-act="add">Add the first trophy</button></div>`;
    return;
  }
  list.innerHTML = order.trophies.map((t, i) => {
    const T = TYPES[t.type];
    const w = trophyWarnings(t, i);
    return `<article class="t-row" data-i="${i}">
      <div class="t-thumb">${renderTrophySVG(t, { plate: false, shadow: false })}</div>
      <div class="t-main">
        <div class="t-title"><h3>${esc(t.label || T.name)}</h3><span class="t-qty">× ${t.qty}</span>${t.label ? `<span class="t-type">${esc(T.name)}</span>` : ''}</div>
        <p class="t-sum">${esc(E.summary(t))}</p>
        ${w.length ? `<p class="t-warn">${esc(w.join(' '))}</p>` : ''}
      </div>
      <div class="t-actions">
        <button class="btn-text" data-act="edit">Edit</button>
        <button class="btn-text" data-act="dup">Duplicate</button>
        <button class="btn-text btn-danger" data-act="del">Remove</button>
      </div>
    </article>`;
  }).join('');
}

const renderPick = debounce(() => {
  const box = $('#pickPreview');
  if (!order.trophies.length) { box.innerHTML = ''; return; }
  const m = E.orderBOM(order);
  const tubes = m.cuts.reduce((s, c) => s + c.tubes.length, 0);
  const c = E.orderCost(order);
  const wasOpen = box.querySelector('details')?.open;
  box.innerHTML = `<details class="pick-prev"${wasOpen ? ' open' : ''}>
    <summary><b>Pick list</b><span>${m.lines.length} lines${tubes ? ` · ${tubes} column tube${tubes > 1 ? 's' : ''}` : ''}</span></summary>
    <div class="pick-body">
      ${m.groups.map(g => `<div class="pl-grp">${esc(g.title)}</div>${g.lines.map(l => `<div class="pl-row"><b>${l.qty}</b><span>${esc(l.name)}${l.note ? ` <em style="color:var(--warn);font-style:normal">(${esc(l.note)})</em>` : ''}</span>${l.sku ? `<code>${esc(l.sku)}</code>` : `<span class="sku-none">${l.cat === 'insert' ? 'make in-house' : l.cat === 'addon' ? 'add-on' : 'SKU needed'}</span>`}</div>`).join('')}`).join('')}
      ${m.cuts.map(c => `<div class="pl-grp">Cuts — ${esc(c.info.label)}</div>${c.tubes.map((tb, i) => `<div class="pl-row"><b>${i + 1}</b><span>${tb.cuts.map(x => E.inch(x)).join(' + ')}</span><span class="sku-none">${E.inch(tb.left)} left</span></div>`).join('')}`).join('')}
      <div class="pl-price">
        <div class="pl-grp" style="margin-top:0">Pricing <span style="font-weight:500;color:var(--muted)">— only you see this; it isn't printed</span></div>
        <table><tbody>${c.per.map(p => `<tr><td>${p.t.qty} × ${esc(p.t.label || TYPES[p.t.type].name)}</td><td class="n">${money(p.material)} parts</td><td class="n">${money(p.price)} each${p.custom ? ' <small>(set)</small>' : ''}</td><td class="n">${money(p.price * p.t.qty)}</td></tr>`).join('')}</tbody>
        ${c.addons.length ? `<tbody class="pl-addons">${c.addons.map(a => `<tr><td>${a.qty} × ${esc(a.name)}</td><td class="n"><small>add-on</small></td><td class="n">${money(a.price)} each</td><td class="n">${money(a.total)}</td></tr>`).join('')}</tbody>` : ''}
        <tfoot>${c.discount ? `<tr><td>Subtotal</td><td></td><td></td><td class="n">${money(c.subtotal)}</td></tr><tr><td>Discount ${order.discount}%</td><td></td><td></td><td class="n">−${money(c.discount)}</td></tr>` : ''}<tr><td>Order total</td><td class="n">${money(c.material)}</td><td></td><td class="n">${money(c.total)}</td></tr></tfoot></table>
        <p class="cost-line">Parts × ${RULES.markup}, rounded up to .99${order.rush ? ` · rush +${RULES.rushPercent}%` : ''} · about ${(c.minutes / 60).toFixed(1)} hours to build${c.missing.length ? ` · no cost yet for ${c.missing.length} part${c.missing.length > 1 ? 's' : ''} (${esc(c.missing.slice(0, 3).join(', '))}${c.missing.length > 3 ? '…' : ''}), so the price is low` : ''}</p>
      </div>
      ${m.warnings.length ? `<div class="pl-warn"><b>Heads up</b><ul>${m.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    </div></details>`;
}, 200);

/* ---------------- add-on items ---------------- */
// an older cached index.html won't have the section — add it rather than fail
if (!$('#addonSection') && $('#trophyList')) $('#trophyList').insertAdjacentHTML('afterend', '<section id="addonSection"><div class="sec-head"><h2>Add-on items <span id="addonCount"></span></h2><button class="btn btn-quiet" id="btnAddon">Add item</button></div><p class="addon-hint">Anything that isn\'t a trophy — extra plates, plaques, medals. You set the price; it\'s added to the quote and shows on the build sheet.</p><div id="addonList"></div></section>');
function renderAddons() {
  const list = $('#addonList'); if (!list) return;
  order.addons = order.addons || [];
  const n = order.addons.reduce((s, a) => s + (a.qty || 0), 0);
  $('#addonCount').textContent = order.addons.length ? `${n} total` : '';
  list.innerHTML = order.addons.map((a, i) => `<div class="addon" data-ai="${i}">
    <label class="addon-img" title="Add a picture">${a.img ? `<img src="${esc(a.img)}" alt="">` : '<span>+ Picture</span>'}<input type="file" accept="image/*" data-aimg hidden></label>
    <div class="addon-main">
      <input class="inp addon-name" data-af="name" value="${esc(a.name)}" placeholder="Item name — e.g. Score plates">
      <textarea class="inp" data-af="desc" rows="2" placeholder="Description the customer sees — size, material, what's on it">${esc(a.desc)}</textarea>
    </div>
    <div class="addon-nums">
      <label>Qty<input class="inp" data-af="qty" type="number" inputmode="numeric" min="0" step="1" value="${a.qty}"></label>
      <label>Price each<input class="inp" data-af="price" type="number" inputmode="decimal" min="0" step="0.01" value="${a.price || ''}" placeholder="0.00"></label>
      <div class="addon-total" data-atotal>${money((a.qty || 0) * (a.price || 0))}</div>
      <div class="addon-btns">${a.img ? '<button class="btn-text" data-aimgdel>Remove picture</button>' : ''}<button class="btn-text btn-danger" data-adel>Remove</button></div>
    </div></div>`).join('');
}
const addonsChanged = debounce(() => renderPick(), 250);
$('#btnAddon') && ($('#btnAddon').onclick = () => {
  order.addons = [...(order.addons || []), E.newAddon()];
  touch(); renderAddons(); renderPick();
  const rows = document.querySelectorAll('.addon'); rows[rows.length - 1]?.querySelector('[data-af="name"]').focus();
});
$('#addonList')?.addEventListener('input', e => {
  const row = e.target.closest('.addon'), f = e.target.dataset.af; if (!row || !f) return;
  const a = order.addons[+row.dataset.ai];
  a[f] = f === 'qty' ? Math.max(0, Math.round(+e.target.value || 0)) : f === 'price' ? Math.max(0, +e.target.value || 0) : e.target.value;
  row.querySelector('[data-atotal]').textContent = money((a.qty || 0) * (a.price || 0));
  const n = order.addons.reduce((s, x) => s + (x.qty || 0), 0); $('#addonCount').textContent = `${n} total`;
  touch(); addonsChanged();
});
$('#addonList')?.addEventListener('change', async e => {
  if (!('aimg' in e.target.dataset)) return;
  const row = e.target.closest('.addon'), f = e.target.files[0]; if (!row || !f) return;
  try { order.addons[+row.dataset.ai].img = await shrinkImage(f); touch(); renderAddons(); }
  catch { toast('Couldn’t read that picture'); }
});
$('#addonList')?.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const row = b.closest('.addon'), i = +row.dataset.ai;
  if ('aimgdel' in b.dataset) { order.addons[i].img = ''; touch(); return renderAddons(); }
  if ('adel' in b.dataset) {
    const [gone] = order.addons.splice(i, 1); touch(); renderAddons(); renderPick();
    toast(`Removed ${gone.name || 'item'}`, { action: 'Undo', onAction: () => { order.addons.splice(i, 0, gone); touch(); renderAddons(); renderPick(); } });
  }
});

function renderOrderArt() { fitArt(order.trophies.flatMap(trophyUrls)); }
function renderOrder() { fillHeader(); renderSaveState(); renderList(); renderAddons(); renderPick(); renderOrderArt(); }

function addTrophy() {
  const last = order.trophies[order.trophies.length - 1];
  const t = E.newTrophy(last ? last.type : 'col2');
  if (last) { t.color = last.color; t.year = last.year; if (E.baseOptions(t.type).some(b => b.id === last.base)) t.base = last.base; }
  order.trophies.push(t);
  touch();
  openEditor(order.trophies.length - 1);
}

$('#trophyList').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  const row = e.target.closest('.t-row');
  if (btn && btn.dataset.act === 'add') return addTrophy();
  if (!row) return;
  const i = +row.dataset.i;
  const act = btn ? btn.dataset.act : 'edit';
  if (act === 'edit') openEditor(i);
  if (act === 'dup') {
    const copy = JSON.parse(JSON.stringify(order.trophies[i]));
    copy.id = E.newTrophy().id;
    order.trophies.splice(i + 1, 0, copy); touch(); renderList(); renderPick();
    toast('Duplicated — edit the copy to change it');
  }
  if (act === 'del') {
    const [gone] = order.trophies.splice(i, 1); touch(); renderList(); renderPick();
    toast(`Removed ${gone.label || TYPES[gone.type].name}`, { action: 'Undo', onAction: () => { order.trophies.splice(i, 0, gone); touch(); renderList(); renderPick(); } });
  }
});
$('#btnAdd').onclick = addTrophy;

/* ---------------- trophy editor ---------------- */
const editor = $('#editor'), form = $('#edForm');
let lastWarnings = [];
const cur = () => order.trophies[editIdx];

function openEditor(i) {
  editIdx = i;
  editor.hidden = false;
  document.body.style.overflow = 'hidden';
  renderEditor();
  form.scrollTop = 0;
}
function closeEditor() {
  editIdx = -1;
  editor.hidden = true;
  document.body.style.overflow = '';
  renderList(); renderPick();
}
$('#edBack').onclick = closeEditor;
$('#edDone').onclick = closeEditor;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !editor.hidden && !layer.children.length) closeEditor(); });

function commit(rerender = true) {
  const r = E.normalizeTrophy(cur(), editIdx);
  if (r.t) { r.t.id = cur().id; order.trophies[editIdx] = r.t; }
  lastWarnings = [...r.errors, ...r.warnings].map(cleanNote);
  touch();
  if (rerender) renderEditor(); else { renderStage(); renderParts(); }
}

function renderStage() {
  const t = cur();
  if (!t || editor.hidden) return;          // the editor closed before a delayed redraw fired
  const T = TYPES[t.type];
  if (!T.catalog) fitArt(trophyUrls(t));
  const box = $('#edRender');
  if (T.catalog && !E.catalogVariant(t)) {
    box.innerHTML = `<p class="ed-height" style="align-self:center">Pick an item and size to see it here.</p>`;
    $('#edHeight').innerHTML = '';
    return;
  }
  const { svg, heightIn } = renderTrophySVG(t, { dims: !T.catalog, withInfo: true });
  box.innerHTML = svg;
  $('#edHeight').innerHTML = T.catalog ? '' : `About <b>${Math.round(heightIn)}″</b> tall`;
}
const renderStageSoon = debounce(renderStage, 150);

const miniCache = new Map();
function typeArt(type, t) {
  const T = TYPES[type];
  if (T.catalog) {
    const p = E.catalogList(type)[0];
    return p ? `<img src="${esc(p.img)}" alt="" style="height:100%;object-fit:contain">` : '';
  }
  const key = [type, t.color, E.itemName(t.figure)].join('|');
  if (!miniCache.has(key)) {
    const s = E.newTrophy(type);
    s.color = t.color; s.figure = t.figure || { name: 'Victory (Male)' };
    s.trim = type === 'col1trim' || T.posts >= 2 ? { name: 'Star' } : null;
    s.middle = { name: 'Star' };
    miniCache.set(key, renderTrophySVG(E.normalizeTrophy(s).t, { plate: false, shadow: false }));
  }
  return miniCache.get(key);
}

/* − [number you can type] + ; step is how far the buttons move */
function stepper(field, value, [lo, hi], { unit = '″', step = 1 } = {}) {
  return `<span class="stepper"><button data-step="${field}" data-dir="${-step}" ${value <= lo ? 'disabled' : ''} aria-label="Less">−</button>` +
    `<input data-num="${field}" type="number" inputmode="decimal" min="${lo}" max="${hi}" step="${step}" value="${value}" aria-label="${field}">${unit ? `<span class="unit">${unit}</span>` : ''}` +
    `<button data-step="${field}" data-dir="${step}" ${value >= hi ? 'disabled' : ''} aria-label="More">+</button></span>`;
}
function pickTile(kind, ref, emptyText) {
  const info = E.itemInfo(ref);
  const sku = E.refSku(ref, cur().year);
  return `<button class="pick-tile" data-pick="${kind}">
    <span class="pt-img" style="${info && info.url ? `background-image:url('${esc(info.url)}')` : ''}">${info && info.url ? '' : ref ? 'custom' : '—'}</span>
    <span><b>${esc(ref ? E.itemName(ref) : emptyText)}</b><span>${ref ? (sku ? esc(sku) : ref.custom ? 'Custom item' : 'SKU not entered yet') : 'Tap to choose'}</span></span>
    <span class="pt-go">${ref ? 'Change' : 'Choose'}</span></button>`;
}

/* Is this spot a plain column (not a JDS riser, not "None")? */
const columnHere = (t, slot) => !E.riserIn(t, slot) && !E.standsBare(t, slot);
/* Column height under a trim or middle item: typed or −/+ in ½″ steps, plus a chip back to the usual height */
function colHeight(field, value, range, autoLabel, isAuto) {
  return `<div class="height-row" style="margin:10px 0 0"><label>Column height</label>${stepper(field, value, range, { step: 0.5 })}
    <button class="chip" data-col-auto="${field}" aria-pressed="${isAuto}">${esc(autoLabel)}</button></div>`;
}

/* Column (or cup) vs a JDS riser in one spot. slot: main | top | trim | middle */
function standsOn(t, slot, columnLabel) {
  const r = E.riserIn(t, slot), bare = E.standsBare(t, slot);
  const canBare = slot === 'trim' || slot === 'middle';
  return `<div class="chips" style="margin:10px 0 8px">
      <button class="chip" data-stand="${slot}:col" aria-pressed="${!r && !bare}">${esc(columnLabel)}</button>
      <button class="chip" data-stand="${slot}:riser" aria-pressed="${!!r}">JDS riser</button>
      ${canBare ? `<button class="chip" data-stand="${slot}:none" aria-pressed="${bare}">None</button>` : ''}</div>
    ${bare ? `<p class="cost-line" style="margin:0 0 4px">Mounts straight to the ${slot === 'middle' ? 'middle lid' : 'base'} — its own stud and a hexnut, no column or rod.</p>` : ''}
    ${r ? `<button class="pick-tile" data-pick="riser:${slot}"><span class="pt-img">${r.img ? `<img src="${esc(r.img)}" alt="" style="max-width:100%;max-height:100%">` : ''}</span><span><b>${esc(r.name)}</b><span>${esc(r.sku)} · ${E.inch(r.height)} tall${r.holder ? ' · holds a 2″ insert' : ''}</span></span><span class="pt-go">Change</span></button>` : ''}`;
}

function renderEditor() {
  const t = cur(), T = TYPES[t.type];
  $('#edTitle').textContent = `Trophy ${editIdx + 1} of ${order.trophies.length}${t.label ? ' — ' + t.label : ''}`;
  const s = [];

  s.push(`<div class="sect"><div class="two">
    <label class="fld" style="margin:0"><span>Name on the sheet (optional)</span><input data-f="label" value="${esc(t.label)}" placeholder="1st place, Grand champion, Coach award…"></label>
    <div><span style="display:block;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:4px">How many</span>${stepper('qty', t.qty, [1, 5000], { unit: '' })}</div>
  </div></div>`);

  s.push(`<div class="sect"><h4>Trophy type</h4><div class="types">${Object.entries(TYPES).map(([k, x]) =>
    `<button class="type-card" data-type="${k}" aria-pressed="${k === t.type}"><span class="tc-art">${typeArt(k, t)}</span>${esc(x.short)}</button>`).join('')}</div></div>`);

  if (T.catalog) {
    const list = E.catalogList(t.type), p = E.catalogProduct(t);
    if (!p) {
      s.push(`<div class="sect"><h4>${esc(T.name)} <small>${list.length} to choose from</small></h4>
        <input class="inp" data-cat-search placeholder="Search by name or SKU" style="margin-bottom:10px">
        <div class="cat-grid">${list.map(x => `<button class="pk-item" data-product="${esc(x.key)}" data-text="${esc((x.title + ' ' + x.variants.map(v => v.sku).join(' ')).toLowerCase())}"><span class="pi-img" style="background-image:url('${esc(x.img)}')"></span>${esc(x.title)}</button>`).join('')}</div></div>`);
    } else {
      s.push(`<div class="sect"><h4>${esc(T.name)}</h4>
        <button class="pick-tile" data-product-clear><span class="pt-img" style="background-image:url('${esc(p.img)}')"></span><span><b>${esc(p.title)}</b><span>${p.variants.length} options</span></span><span class="pt-go">Change</span></button>
        <label class="fld" style="margin-top:12px"><span>${esc(p.optNames.join(' / '))}</span>
          <select data-variant><option value="">Choose…</option>${p.variants.map(v => `<option value="${esc(v.sku)}" ${t.catalog.sku === v.sku ? 'selected' : ''}>${esc(v.opts.join(' · '))} — ${esc(v.sku)}</option>`).join('')}</select></label></div>`);
    }
  } else {
    s.push(`<div class="sect"><h4>Base</h4><div class="chips">${E.baseOptions(t.type).map(b =>
      `<button class="chip" data-base="${b.id}" aria-pressed="${b.id === t.base}">${esc(b.label)}</button>`).join('')}</div></div>`);
    if (T.posts) {
      s.push(`<div class="sect"><h4>Column color <small>${esc(COLUMNS[t.color].sku || 'SKU not entered yet')}</small></h4><div class="swatches">${Object.keys(COLUMNS).map(c => {
        const sw = SWATCHES.columns[c];
        return `<button class="swatch" data-color="${c}" aria-pressed="${c === t.color}"><i style="background-image:url('${esc(sw.url)}'),${esc(sw.fallback)}"></i>${c}</button>`;
      }).join('')}</div></div>`);
    }
    if (T.tiers === 1 && T.posts) {
      const range = T.posts === 1 ? RULES.heights.single : RULES.heights.multi;
      const riserHere = T.posts === 1 && E.riserIn(t, 'main');
      s.push(`<div class="sect"><h4>${T.posts === 1 ? 'Under the figure' : 'Column height'}</h4>
        ${T.posts === 1 ? standsOn(t, 'main', 'Column') : ''}
        ${riserHere ? '' : `<div class="height-row">${stepper('height', t.height, range)}<span class="range">${range[0]}–${range[1]}″</span></div>`}</div>`);
    }
    if (T.tiers === 2) {
      const auto = E.middleRiserHeight({ ...t, middleRiser: 'auto' });
      s.push(`<div class="sect"><h4>Column heights</h4>
        <div class="height-row"><label>Bottom tier</label>${stepper('lower', t.lower, RULES.heights.tierLower)}<span class="range">${RULES.heights.tierLower.join('–')}″</span></div>
        <div class="height-row"><label>Top tier</label>${stepper('upper', t.upper, RULES.heights.tierUpper)}<span class="range">${RULES.heights.tierUpper.join('–')}″</span></div></div>`);
    }
    if (T.posts >= 2) {
      const r = E.riserFor(t);
      const autoKey = (T.tiers === 2 ? RULES.riserTwoTier : RULES.riserByPosts)[T.posts];
      const sizeLabel = k => t.riser === 'column' ? `${E.inch(RISER_CUPS[k].height)} column` : RISER_CUPS[k].label;
      const top = E.riserIn(t, 'top');
      s.push(`<div class="sect"><h4>Under the top figure <small>${top ? `${esc(top.sku)}` : t.riser === 'column' ? `${E.inch(E.columnRiserHeight(t))} column riser` : `${r.label}: ${r.cup} + ${r.lid}`}</small></h4>
        <div class="chips" style="margin-bottom:10px">
          <button class="chip" data-riser="cup" aria-pressed="${!top && t.riser !== 'column'}">Cup</button>
          <button class="chip" data-riser="column" aria-pressed="${!top && t.riser === 'column'}">Column riser</button>
          <button class="chip" data-stand="top:riser" aria-pressed="${!!top}">JDS riser</button></div>
        ${top ? standsOn(t, 'top', '').replace(/^[\s\S]*?<\/div>/, '') : `<div class="chips">
          <button class="chip" data-riser-size="auto" aria-pressed="${t.riserSize === 'auto'}">Auto <small>${esc(sizeLabel(autoKey))}</small></button>
          ${Object.keys(RISER_CUPS).map(k => `<button class="chip" data-riser-size="${k}" aria-pressed="${t.riserSize === k}">${esc(sizeLabel(k))}</button>`).join('')}</div>
        ${t.riser === 'column' ? `<div class="height-row" style="margin:12px 0 0"><label>Column riser height</label>${stepper('riserHeight', E.columnRiserHeight(t), RULES.heights.topRiser, { step: 0.5 })}<span class="range">${RULES.heights.topRiser.join('–')}″</span></div>` : ''}`}</div>`);
    }
    s.push(`<div class="sect"><h4>${T.posts >= 2 ? 'Top figure' : 'Figure'}</h4>${pickTile('figure', t.figure, 'No figure yet')}</div>`);
    if (T.tiers === 2) s.push(`<div class="sect"><h4>Middle item <small>on the middle lid</small></h4>${pickTile('middle', t.middle, 'No middle item yet')}
      ${standsOn(t, 'middle', `${E.inch(E.middleRiserHeight(t))} column`)}
      ${columnHere(t, 'middle') ? colHeight('middleRiser', E.middleRiserHeight(t), RULES.heights.middleRiser, `Auto ${E.inch(E.middleRiserHeight({ ...t, middleRiser: 'auto' }))}`, t.middleRiser === 'auto') : ''}</div>`);
    if (t.type === 'col1trim' || T.posts >= 2) {
      const info = E.itemInfo(t.trim);
      s.push(`<div class="sect"><h4>${T.tiers === 2 ? 'Bottom trim' : 'Trim'} <small>${T.posts >= 2 ? 'on the base' : 'straight on the base'}</small></h4>${pickTile('trim', t.trim, 'No trim')}
        ${info && info.year ? `<div class="inline-fields"><label class="fld"><span>Year on the trim</span><input class="inp" data-f="year" type="number" inputmode="numeric" value="${t.year}" style="width:110px"></label></div>` : ''}
        ${T.posts >= 2 && t.trim ? standsOn(t, 'trim', `${E.inch(E.trimColumnHeight(t))} column`) : ''}
        ${T.posts >= 2 && t.trim && columnHere(t, 'trim') ? colHeight('trimHeight', E.trimColumnHeight(t), RULES.heights.trimColumn, `Usual ${E.inch(E.trimColumnDefault(t))}`, !t.trimHeight) : ''}</div>`);
    }
  }

  const holders = T.catalog ? 0 : E.trophyInserts(t);
  if (holders) s.push(`<div class="sect"><h4>2″ insert${holders > 1 ? 's' : ''} <small>${holders} per trophy, ${holders * t.qty} in all</small></h4>
    <div class="chips" style="margin-bottom:10px">${Object.entries(INSERT_TYPES).map(([k, v]) => `<button class="chip" data-insert="${k}" aria-pressed="${t.insert.type === k}">${esc(v.label)}</button>`).join('')}</div>
    <label class="fld" style="margin:0"><span>Logo or artwork</span><input class="inp" data-f="insertArt" value="${esc(t.insert.art)}" placeholder="Tournament logo, pink ribbon bowling ball…"></label>
    <p class="cost-line" style="margin-top:6px">${esc(INSERT_TYPES[t.insert.type].how)}.</p></div>`);

  s.push(`<div class="sect"><h4>Plates <small>${t.qty} plate${t.qty > 1 ? 's' : ''}, one per trophy</small></h4><div class="plates-wrap"><table class="plates-t">
    <thead><tr><th></th>${[0, 1, 2].map(j => `<th>Line ${j + 1}${t.qty > 1 ? ` <button data-fill="${j}" title="Copy plate 1’s line to every plate">copy down</button>` : ''}</th>`).join('')}</tr></thead>
    <tbody>${t.plates.map((p, i) => `<tr><td>${i + 1}</td>${p.map((x, j) => `<td><input data-plate="${i},${j}" value="${esc(x)}" aria-label="Plate ${i + 1} line ${j + 1}"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`);

  s.push(`<div class="sect"><h4>Extra parts <small>anything the rules don't add</small></h4>
    <div id="extras">${t.extras.map((x, i) => `<div class="extras-row"><input type="number" min="1" data-extra="${i},qty" value="${x.qty}" aria-label="Quantity"><input data-extra="${i},name" value="${esc(x.name)}" placeholder="Part"><input data-extra="${i},sku" value="${esc(x.sku)}" placeholder="SKU"><button class="icon-btn" data-extra-del="${i}" aria-label="Remove part">✕</button></div>`).join('')}</div>
    <button class="btn btn-quiet btn-sm" data-extra-add>Add a part</button></div>`);

  s.push(`<div class="sect"><h4>Extra labor <small>only when this trophy needs more than a normal build — charged at your shop rate, not marked up</small></h4>
    <div class="inline-fields" style="margin-top:0"><label class="fld"><span>Minutes per trophy</span><input class="inp" data-f="extraLabor" type="number" inputmode="numeric" min="0" step="5" value="${t.extraLabor || ''}" placeholder="0" style="width:120px"></label></div></div>`);
  s.push(`<div class="sect"><label class="fld" style="margin:0 0 10px"><span>Notes for the builder</span><textarea data-f="notes" rows="2">${esc(t.notes)}</textarea></label>
    <label class="fld" style="margin:0"><span>Customer notes <small class="fld-hint">from or for the customer, about this trophy</small></span><textarea data-f="customerNotes" rows="2">${esc(t.customerNotes)}</textarea></label></div>`);
  s.push(`<div class="sect" id="edParts"></div>`);

  form.innerHTML = s.join('');
  renderStage();
  renderParts();
}

function renderParts() {
  const t = cur();
  const bom = E.trophyBOM(t);
  const cost = E.trophyCost(t, order);
  const warns = [...new Set([...lastWarnings, ...bom.warnings])];
  $('#edParts').innerHTML = `<h4>Parts for one trophy <small>${bom.lines.length} lines</small></h4>
    <table class="parts-t"><tbody>${bom.lines.map(l => `<tr><td>${l.qty}</td><td>${esc(l.name)}${l.note ? ` <em style="color:var(--warn);font-style:normal">(${esc(l.note)})</em>` : ''}</td><td>${l.sku ? `<span class="sku-t">${esc(l.sku)}</span>` : `<span class="sku-none">${l.cat === 'insert' ? 'make in-house' : 'SKU needed'}</span>`}</td></tr>`).join('')}</tbody></table>
    ${warns.length ? `<div class="warn-box"><ul>${warns.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <div class="inline-fields" style="margin-top:12px"><label class="fld"><span>Price each</span><input class="inp" data-f="priceEach" type="number" inputmode="decimal" min="0" step="0.01" value="${t.priceEach ?? ''}" placeholder="${cost.formula.toFixed(2)}" style="width:130px"></label>
      <span class="cost-line" style="margin:0 0 10px">${t.priceEach ? `Set price — the formula would say ${money(cost.formula)}. Clear it to go back.` : 'Blank = the formula below. Type a price for customers with set pricing.'}</span></div>
    <p class="cost-line">${cost.custom ? 'Formula: ' : 'Each: '}parts <b>${money(cost.material)}</b> × ${cost.markup}${cost.labor ? ` + extra labor <b>${money(cost.labor)}</b>` : ''}${cost.rush ? ` + rush <b>${money(cost.rush)}</b>` : ''} → <b>${money(cost.formula)}</b>${cost.custom ? `; using your set price <b>${money(cost.price)}</b>` : ''}${cost.missing.length ? `. No cost yet for ${cost.missing.length} part${cost.missing.length > 1 ? 's' : ''}, so that's low` : ''}. Only you see this.</p>`;
}

function changeType(type) {
  const old = cur(), T = TYPES[type];
  const t = E.newTrophy(type);
  Object.assign(t, { id: old.id, label: old.label, qty: old.qty, plates: old.plates, notes: old.notes, extras: old.extras, color: old.color, year: old.year });
  if (!T.catalog) t.figure = old.figure;
  if (type === 'col1trim' || T.posts >= 2) t.trim = old.trim;
  if (T.tiers === 2) { t.middle = old.middle; t.lower = old.lower; t.upper = old.upper; }
  if (T.posts >= 2) { t.riser = old.riser; }
  if (E.baseOptions(type).some(b => b.id === old.base)) t.base = old.base;
  const range = T.posts === 1 ? RULES.heights.single : RULES.heights.multi;
  if (old.height >= range[0] && old.height <= range[1]) t.height = old.height;
  if (T.catalog && old.type === type) t.catalog = old.catalog;
  order.trophies[editIdx] = t;
  commit();
}

form.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const t = cur(), d = b.dataset;
  if (d.type) { if (d.type !== t.type) changeType(d.type); return; }
  if (d.base) { t.base = d.base; return commit(); }
  if (d.color) { t.color = d.color; return commit(); }
  if (d.step) {
    const dir = +d.dir;
    if (d.step === 'qty') t.qty = Math.max(1, t.qty + dir);
    else if (d.step === 'riserHeight') t.riserHeight = E.columnRiserHeight(t) + dir;
    else if (d.step === 'middleRiser') t.middleRiser = E.middleRiserHeight(t) + dir;
    else if (d.step === 'trimHeight') t.trimHeight = E.trimColumnHeight(t) + dir;
    else t[d.step] = (t[d.step] || 0) + dir;
    return commit();
  }
  if (d.riser) { t.riser = d.riser; if (t.risers && t.risers.top) { const r = { ...t.risers }; delete r.top; t.risers = r; } return commit(); }
  if (d.riserSize) { t.riserSize = d.riserSize; t.riserHeight = null; return commit(); }
  if (d.stand) {
    const [slot, what] = d.stand.split(':');
    t.risers = { ...(t.risers || {}) };
    if (what === 'col') { delete t.risers[slot]; return commit(); }
    if (what === 'none') { t.risers[slot] = 'none'; return commit(); }
    if (!t.risers[slot] || t.risers[slot] === 'none') return openPicker('riser:' + slot);
    return;
  }
  if (d.insert) { t.insert = { ...t.insert, type: d.insert }; return commit(); }
  if (d.colAuto) { t[d.colAuto] = d.colAuto === 'middleRiser' ? 'auto' : null; return commit(); }
  if (d.midRiser) { t.middleRiser = d.midRiser === 'auto' ? 'auto' : +d.midRiser; return commit(); }
  if (d.pick) return openPicker(d.pick);
  if (d.product) { t.catalog = { product: d.product, sku: '' }; const p = E.catalogProduct(t); if (p && p.variants.length === 1) t.catalog.sku = p.variants[0].sku; return commit(); }
  if ('productClear' in d) { t.catalog = null; return commit(); }
  if (d.fill) {
    const j = +d.fill;
    t.plates.forEach(p => { p[j] = t.plates[0][j]; });
    form.querySelectorAll(`[data-plate$=",${j}"]`).forEach(inp => { inp.value = t.plates[0][j]; });
    touch(); renderStageSoon(); return;
  }
  if ('extraAdd' in d) { t.extras.push({ name: '', sku: '', qty: 1 }); renderEditor(); form.querySelector('#extras .extras-row:last-child [data-extra$="name"]').focus(); return; }
  if (d.extraDel) { t.extras.splice(+d.extraDel, 1); commit(); }
});
form.addEventListener('input', e => {
  const el = e.target, t = cur(), d = el.dataset;
  if (d.f === 'insertArt') { t.insert = { ...t.insert, art: el.value }; touch(); return; }
  if (d.f === 'priceEach') return;
  if (d.f === 'extraLabor') { t.extraLabor = Math.max(0, Math.round(+el.value || 0)); touch(); renderParts(); return; }
  if (d.f) { t[d.f] = d.f === 'year' ? +el.value || t.year : el.value; if (d.f === 'label') $('#edTitle').textContent = `Trophy ${editIdx + 1} of ${order.trophies.length}${el.value ? ' — ' + el.value : ''}`; touch(); if (d.f === 'year') renderParts(); return; }
  if (d.plate) { const [i, j] = d.plate.split(',').map(Number); t.plates[i][j] = el.value; touch(); if (i === 0) renderStageSoon(); return; }
  if (d.extra) {
    const [i, k] = d.extra.split(','); t.extras[+i][k] = k === 'qty' ? Math.max(1, +el.value || 1) : el.value;
    touch(); debounce(renderParts, 300)(); return;
  }
  if ('catSearch' in d) {
    const q = el.value.toLowerCase().trim();
    form.querySelectorAll('[data-product]').forEach(x => { x.hidden = q && !x.dataset.text.includes(q); });
  }
});
form.addEventListener('change', e => {
  const el = e.target, t = cur();
  if (el.dataset.num) {
    const v = parseFloat(el.value);
    if (!Number.isFinite(v)) return renderEditor();
    const k = el.dataset.num;
    t[k] = k === 'qty' ? Math.max(1, Math.round(v)) : v;
    return commit();
  }
  if (el.dataset.f === 'priceEach') { t.priceEach = +el.value > 0 ? Math.round(+el.value * 100) / 100 : null; return commit(false); }
  if ('variant' in el.dataset) { t.catalog.sku = el.value; commit(); }
  if (el.dataset.f === 'year' || el.dataset.extra) commit(false);
});

/* ---------------- figure / trim / middle picker ---------------- */
function openPicker(kind) {
  const t = cur();
  const jdsPool = { id: 'jds', label: 'JDS catalog', items: JDS_ITEMS };
  const riserSlot = kind.startsWith('riser:') ? kind.slice(6) : null;
  const figs = FIGURES.filter(x => !x.discontinued), trims = TRIMS.filter(x => !x.discontinued);   // hide what JDS stopped making
  const minePool = () => ({ id: 'mine', label: `Your figures (${myItems.length})`, items: myItems.map(i => ({ ...i, url: i.img, category: 'Yours', mine: i.id })) });
  const pools = riserSlot ? [{ id: 'jds', label: `JDS risers (${JDS_RISERS.length})`, items: JDS_RISERS }]
    : kind === 'figure' ? [{ id: 'fig', label: 'Figures', items: figs }, minePool(), jdsPool]
    : kind === 'trim' ? [{ id: 'trim', label: 'Trims & holders', items: t.type === 'col1trim' ? trims.filter(x => !x.multiOnly) : trims }, minePool(), jdsPool]
    : [{ id: 'trim', label: 'Trims & holders', items: trims }, { id: 'fig', label: 'Figures', items: figs }, minePool(), jdsPool];
  const current = riserSlot ? (t.risers && t.risers[riserSlot] && t.risers[riserSlot] !== 'none' ? { custom: { sku: t.risers[riserSlot] } } : null) : t[kind];
  let pool = pools[0].id, cat = 'All', q = '';
  const title = riserSlot ? 'Choose a riser' : { figure: 'Choose the top figure', trim: 'Choose the trim', middle: 'Choose the middle item' }[kind];
  const m = modal(`<div class="pk-head"><div class="pk-top"><h3>${title}</h3><button class="btn btn-quiet btn-sm" data-close>Close</button></div>
    <input class="inp" data-q placeholder="Search" type="search"><div class="pk-cats" data-cats></div></div><div class="pk-grid" data-grid></div>`, { cls: 'picker' });
  const box = m.box;
  const set = ref => {
    if (riserSlot) { t.risers = { ...(t.risers || {}) }; if (ref && ref.custom && ref.custom.sku) t.risers[riserSlot] = ref.custom.sku; }
    else t[kind] = ref;
    m.close(); commit();
  };
  function draw() {
    const mp = pools.find(p => p.id === 'mine'); if (mp) Object.assign(mp, minePool());   // refresh after add/remove
    const tabs = [...pools.map(p => ({ key: 'pool:' + p.id, label: p.label, on: pool === p.id && cat !== 'custom' })), ...(riserSlot ? [] : [{ key: 'custom', label: 'Custom item', on: cat === 'custom' }])];
    const items = pools.find(p => p.id === pool).items;
    const cats = pool === 'jds' || pool === 'mine' ? ['All'] : ['All', ...new Set(items.map(i => i.sub || i.category))];
    box.querySelector('[data-cats]').innerHTML =
      tabs.map(x => `<button class="chip" data-tab="${x.key}" aria-pressed="${x.on}">${esc(x.label)}</button>`).join('') +
      (cat !== 'custom' ? '<span style="width:10px;flex:0 0 auto"></span>' + cats.map(c => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join('') : '');
    const grid = box.querySelector('[data-grid]');
    if (cat === 'custom') {
      const c = current && current.custom ? current.custom : { name: '', sku: '', img: '' };
      grid.outerHTML = `<div class="pk-custom" data-grid>
        <p style="margin:0 0 12px;color:var(--muted)">For a figure or holder that isn't in the list — another supplier's, or old stock. It shows on the parts list with the SKU you enter.</p>
        <label class="fld"><span>Name</span><input class="inp" data-cname value="${esc(c.name)}" placeholder="Music note holder"></label>
        <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:10px">
          <label class="fld"><span>SKU</span><input class="inp" data-csku value="${esc(c.sku)}" placeholder="Optional"></label>
          <label class="fld"><span>Your cost each</span><input class="inp" data-ccost type="number" inputmode="decimal" min="0" step="0.01" value="${c.cost ?? ''}" placeholder="$0.00"></label>
          <label class="fld"><span>Height (in)</span><input class="inp" data-cheight type="number" inputmode="decimal" min="0" step="0.25" value="${c.height ?? ''}" placeholder="5.5"></label>
        </div>
        <div class="img-drop"><i data-cimg style="${c.img ? `background-image:url('${c.img}')` : ''}"></i><label class="btn btn-quiet btn-sm">Add a picture<input type="file" accept="image/*" data-cfile hidden></label></div>
        <label class="toggle" style="margin-top:14px;display:flex;gap:8px;align-items:center"><input type="checkbox" data-csave ${c.mine ? '' : 'checked'}><span>Save to <b>Your figures</b> to use again${c.mine ? ' (already saved)' : ''}</span></label>
        <div class="row" style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-cuse>Use this item</button></div></div>`;
      let img = c.img;
      box.querySelector('[data-cfile]').onchange = async ev => { img = await shrinkImage(ev.target.files[0]); box.querySelector('[data-cimg]').style.backgroundImage = `url('${img}')`; };
      box.querySelector('[data-cuse]').onclick = async () => {
        const name = box.querySelector('[data-cname]').value.trim();
        if (!name) return toast('Give the item a name');
        const costV = box.querySelector('[data-ccost]').value, hV = +box.querySelector('[data-cheight]').value;
        const item = { name, sku: box.querySelector('[data-csku]').value.trim(), img };
        if (costV !== '' && +costV >= 0) item.cost = Math.round(+costV * 100) / 100;
        if (hV > 0) item.height = hV;
        if (box.querySelector('[data-csave]').checked) {
          const id = 'm' + Date.now().toString(36);
          try { await saveMyItems(list => [...list, { id, ...item }]); item.mine = id; toast(`Saved to Your figures`); }
          catch (e) { toast('Used it, but couldn’t save it to Your figures: ' + e.message); }
        }
        set({ custom: item });
      };
      return;
    }
    const qq = q.toLowerCase();
    const list = items.filter(i => (cat === 'All' || (i.sub || i.category) === cat) && (!qq || (i.name + ' ' + i.category + ' ' + (i.sub || '') + ' ' + i.sku).toLowerCase().includes(qq)));
    const none = kind === 'trim' ? `<button class="pk-item" data-none aria-pressed="${!current}"><span class="pi-img" style="display:flex;align-items:center;justify-content:center;color:var(--muted)">None</span>No trim</button>` : '';
    const shown = pool === 'jds' && !qq ? list.slice(0, 60) : list.slice(0, 200);
    if (pool === 'mine') {
      const g = box.querySelector('[data-grid]');
      const tiles = list.map(i => `<div class="pk-mine"><button class="pk-item" data-mine="${esc(i.mine)}" aria-pressed="${!!(current && current.custom && current.custom.mine === i.mine)}"><span class="pi-img">${i.url ? `<img src="${esc(i.url)}" alt="">` : 'No picture'}</span>${esc(i.name)}<small>${esc(i.sku || 'no SKU')}${i.cost != null ? ' · $' + (+i.cost).toFixed(2) : ''}</small></button><button class="pk-del" data-del-mine="${esc(i.mine)}">Remove</button></div>`).join('');
      const empty = `<p style="grid-column:1/-1;color:var(--muted)">${myItems.length ? 'Nothing matches that search.' : 'Nothing saved yet. Use <b>Custom item</b> to add a figure you have on hand — it’s kept here until you remove it.'}</p>`;
      if (g.classList.contains('pk-custom')) g.outerHTML = `<div class="pk-grid" data-grid>${tiles || empty}</div>`; else g.innerHTML = tiles || empty;
      return;
    }
    const html = none + shown.map(i => `<button class="pk-item" ${i.jds ? `data-jds="${esc(i.sku)}"` : `data-name="${esc(i.name)}"`} aria-pressed="${!!current && (i.jds ? current.custom && current.custom.sku === i.sku : current.name === i.name)}"><span class="pi-img"><img src="${esc(i.url)}" alt="" loading="lazy"></span>${esc(i.name)}${i.sku ? `<small>${esc(i.sku)}${i.jds && jds(i.sku).cost ? ' · $' + jds(i.sku).cost.toFixed(2) : ''}</small>` : ''}</button>`).join('') +
      (list.length > shown.length ? `<p style="grid-column:1/-1;color:var(--muted);text-align:center">${list.length - shown.length} more — keep typing to narrow it down.</p>` : '');
    const g2 = box.querySelector('[data-grid]');
    if (g2.classList.contains('pk-custom')) g2.outerHTML = `<div class="pk-grid" data-grid>${html}</div>`; else g2.innerHTML = html || '<p style="grid-column:1/-1;color:var(--muted)">Nothing matches that search.</p>';
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('close' in b.dataset) return m.close();
    if (b.dataset.tab) { if (b.dataset.tab === 'custom') cat = 'custom'; else { pool = b.dataset.tab.slice(5); cat = 'All'; } return draw(); }
    if (b.dataset.cat) { cat = b.dataset.cat; return draw(); }
    if ('none' in b.dataset) return set(null);
    if (b.dataset.mine) { const i = myItems.find(x => x.id === b.dataset.mine); if (i) { const { id, ...rest } = i; return set({ custom: { ...rest, mine: id } }); } return; }
    if (b.dataset.delMine) {
      const i = myItems.find(x => x.id === b.dataset.delMine);
      if (!i || !confirm(`Remove “${i.name}” from Your figures? Orders that already use it keep it.`)) return;
      saveMyItems(list => list.filter(x => x.id !== i.id)).then(() => { toast('Removed'); draw(); }).catch(err => toast(err.message));
      return;
    }
    if (b.dataset.jds) { const i = jds(b.dataset.jds); return set({ custom: { name: i.name, sku: i.sku, img: i.img } }); }
    if (b.dataset.name) return set({ name: b.dataset.name });
  });
  box.querySelector('[data-q]').addEventListener('input', e => { q = e.target.value; if (cat === 'custom') cat = 'All'; draw(); });
  if (current && current.custom && current.custom.mine && pools.some(p => p.id === 'mine')) pool = 'mine';
  else if (current && current.custom && current.custom.sku && jds(current.custom.sku)) pool = 'jds';
  else if (current && current.custom) cat = 'custom';
  else if (current && pools.length > 1 && FIGURES.some(f => f.name === current.name) && !TRIMS.some(f => f.name === current.name)) pool = 'fig';
  draw();
}
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 300 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      const webp = c.toDataURL('image/webp', 0.85);           // keeps see-through backgrounds, much smaller
      resolve(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ---------------- save / open / sheet / checklist ---------------- */
async function save({ quiet = false } = {}) {
  if (!order.trophies.length) { toast('Add a trophy before saving'); return false; }
  try {
    const checkCode = await encodeOrder(order);
    const r = await store.save({ ...order, checkCode });
    order.id = r.id; savedAt = r.updated; dirty = false; persist(); renderSaveState();
    if (!quiet) toast(store.mode === 'server' ? 'Saved' : 'Saved on this device');
    return true;
  } catch (e) {
    if (!e.cancelled) toast(e.message);
    return false;
  }
}
async function checklistURL() {
  const base = new URL('checklist.html', location.href).href;
  if (await store.detect() === 'server' && (!dirty && order.id || await save({ quiet: true }))) return `${base}#s=${order.id}`;
  return `${base}#${await encodeOrder(order)}`;
}
async function buildSheet() {
  if (!order.trophies.length) return toast('Add a trophy first');
  const win = window.open('', '_blank');
  let url = '';
  try { url = await checklistURL(); } catch { /* sheet still works without the QR */ }
  localStorage.setItem(SHEET, JSON.stringify({ order, checklistUrl: url, settings: { ...serverSettings, artBounds: BOUNDS } }));
  if (win) win.location.href = 'sheet.html'; else location.href = 'sheet.html';
}
function openQuote() {
  if (!order.trophies.length) return toast('Add a trophy first');
  const c = E.orderCost(order);
  if (c.missing.length) toast(`Heads up: ${c.missing.length} part${c.missing.length > 1 ? 's have' : ' has'} no cost yet, so some prices may be low`, { ms: 5000 });
  localStorage.setItem('tbs:quote', JSON.stringify({ order, settings: { ...serverSettings, artBounds: BOUNDS } }));
  const win = window.open('quote.html', '_blank');
  if (!win) location.href = 'quote.html';
}
async function sendChecklist() {
  if (!order.trophies.length) return toast('Add a trophy first');
  const url = await checklistURL();
  const title = `Pick list${order.orderNo ? ' — order ' + order.orderNo : ''}`;
  if (navigator.share) { try { await navigator.share({ title, text: title + (order.customer ? ' (' + order.customer + ')' : ''), url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Checklist link copied — paste it in a text'); }
  catch { modal(`<h3>Checklist link</h3><p>Copy this link and send it to whoever is pulling parts.</p><textarea class="inp" rows="4" readonly>${esc(url)}</textarea><div class="row"><button class="btn btn-primary" data-x>Done</button></div>`).box.querySelector('[data-x]').onclick = () => document.querySelector('.scrim').click(); }
}
function setOrder(o, { keepDirty = false } = {}) {
  order = o; dirty = keepDirty; if (!keepDirty) savedAt = o.updated || savedAt;
  persist(); renderOrder(); window.scrollTo(0, 0);
}
async function newOrder() {
  if (dirty && order.trophies.length && !(await confirmBox('Start a new order?', 'This order has changes that aren’t saved. They’ll be lost.', 'Start new'))) return;
  savedAt = ''; setOrder(E.newOrder());
}
async function openOrders() {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('aria-label', 'Saved orders');
  d.innerHTML = `<div class="drawer-head"><h3>Saved orders</h3><button class="btn btn-quiet btn-sm" data-close>Close</button></div>
    <div class="drawer-search"><input class="inp" data-q placeholder="Search order #, customer"></div><div class="drawer-list" data-list><p class="o-empty">Loading…</p></div>`;
  const close = () => { scrim.remove(); d.remove(); };
  scrim.onclick = close; layer.append(scrim, d);
  let rows = [];
  const draw = () => {
    const q = d.querySelector('[data-q]').value.toLowerCase();
    const list = rows.filter(r => !q || `${r.orderNo} ${r.customer}`.toLowerCase().includes(q));
    d.querySelector('[data-list]').innerHTML = list.length ? list.map(r => `<div class="o-row"><b>${esc(r.orderNo || 'No order #')}</b> ${esc(r.customer || '')}
      <div class="o-meta">${r.count} troph${r.count === 1 ? 'y' : 'ies'}${r.due ? ' · due ' + esc(fmtDate(r.due)) : ''}${r.updated ? ' · saved ' + esc(new Date(r.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : ''}</div>
      <div class="o-btns"><button class="btn btn-primary btn-sm" data-open="${r.id}">Open</button><button class="btn btn-quiet btn-sm" data-repeat="${r.id}">Repeat order</button><button class="btn-text btn-danger" data-del="${r.id}" style="margin-left:auto">Delete</button></div></div>`).join('')
      : `<p class="o-empty">${rows.length ? 'No orders match.' : 'No saved orders yet. Build an order and press Save.'}</p>`;
  };
  d.querySelector('[data-q]').oninput = draw;
  d.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('close' in b.dataset) return close();
    const id = b.dataset.open || b.dataset.repeat || b.dataset.del;
    if (!id) return;
    if (b.dataset.del) {
      if (!(await confirmBox('Delete this order?', 'It moves to the trash folder on the server.', 'Delete'))) return;
      try { await store.del(id); rows = rows.filter(r => r.id !== id); draw(); toast('Deleted'); } catch (err) { toast(err.message); }
      return;
    }
    if (dirty && order.trophies.length && !(await confirmBox('Open another order?', 'This order has changes that aren’t saved. They’ll be lost.', 'Open'))) return;
    try {
      const raw = await store.get(id);
      const o = E.normalizeOrder(raw).order;
      if (b.dataset.repeat) {
        o.id = ''; o.orderNo = ''; o.due = ''; o.trophies.forEach(t => { t.id = E.newTrophy().id; });
        savedAt = ''; setOrder(o, { keepDirty: true }); toast('Copied as a new order — give it an order # and due date');
      } else { o.id = raw.id; savedAt = raw.updated || ''; setOrder(o); }
      close();
    } catch (err) { toast(err.message); }
  });
  try { rows = await store.list(); draw(); }
  catch (e) { d.querySelector('[data-list]').innerHTML = `<p class="o-empty">${esc(e.cancelled ? 'Enter the passcode to see saved orders.' : e.message)}</p>`; }
}
function openMore(btn) {
  const r = btn.getBoundingClientRect();
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.style.background = 'transparent';
  const menu = document.createElement('div'); menu.className = 'menu'; menu.setAttribute('role', 'menu');
  menu.style.right = Math.max(8, innerWidth - r.right) + 'px'; menu.style.bottom = (innerHeight - r.top + 8) + 'px';
  menu.innerHTML = `
    <button data-m="dup" role="menuitem"><span>Duplicate this order<small>Make a copy to requote with other options — the original stays as it is</small></span></button>
    <button data-m="quote" role="menuitem"><span>Customer quote<small>Pictures and prices to send — save as PDF</small></span></button>
    <button data-m="csv" role="menuitem"><span>Plate CSV<small>For EngraveLab — same columns as buildatrophy</small></span></button>
    <button data-m="text" role="menuitem"><span>Copy pick list as text<small>To paste in a message or notes</small></span></button>
    <button data-m="export" role="menuitem"><span>Download order file<small>JSON — the command-line tool reads this too</small></span></button>
    <button data-m="import" role="menuitem"><span>Open an order file<small>From the agent or another computer</small></span></button>`;
  const close = () => { scrim.remove(); menu.remove(); };
  scrim.onclick = close; layer.append(scrim, menu);
  menu.onclick = async e => {
    const b = e.target.closest('[data-m]'); if (!b) return; close();
    if (!order.trophies.length && b.dataset.m !== 'import') return toast('Add a trophy first');
    if (b.dataset.m === 'dup') return duplicateOrder();
    if (b.dataset.m === 'quote') return openQuote();
    if (b.dataset.m === 'csv') download(fileBase() + '_plates.csv', E.plateCSV(order), 'text/csv');
    if (b.dataset.m === 'export') { const { checkCode, ...o } = order; download(fileBase() + '_order.json', JSON.stringify(o, null, 2), 'application/json'); }
    if (b.dataset.m === 'text') { try { await navigator.clipboard.writeText(E.masterText(order)); toast('Pick list copied'); } catch { toast('Couldn’t reach the clipboard'); } }
    if (b.dataset.m === 'import') $('#importFile').click();
  };
}
/* Duplicate: a full copy (customer, due date, notes, plates, prices, add-ons) saved as a
   separate order, so a requote never touches the original. "INV-1" becomes "INV-1 v2". */
function nextVersion(no) {
  if (!no) return '';
  const m = no.match(/^(.*?)\s*v(\d+)$/i);
  return m ? `${m[1]} v${+m[2] + 1}` : `${no} v2`;
}
async function duplicateOrder() {
  const { checkCode, ...src } = order;
  const copy = E.normalizeOrder(JSON.parse(JSON.stringify(src))).order;
  copy.id = '';
  copy.orderNo = nextVersion(order.orderNo);
  copy.trophies.forEach(t => { t.id = E.newTrophy().id; });
  copy.addons.forEach(a => { a.id = E.newAddon().id; });
  savedAt = ''; setOrder(copy, { keepDirty: true });
  const ok = await save({ quiet: true });
  toast(ok ? `Copy saved as ${copy.orderNo || 'a new order'} — the original is unchanged` : 'Copy made — press Save to keep it', { ms: 5000 });
}

$('#importFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const raw = JSON.parse(await f.text());
    const r = E.normalizeOrder(Array.isArray(raw) ? { trophies: raw } : raw);
    if (dirty && order.trophies.length && !(await confirmBox('Replace this order?', 'This order has changes that aren’t saved.', 'Replace'))) return;
    r.order.id = '';   // an opened file always saves as its own order — it never overwrites a saved one
    savedAt = ''; setOrder(r.order, { keepDirty: true });
    const notes = [...r.errors, ...r.warnings];
    if (notes.length) modal(`<h3>Opened with notes</h3><ul style="padding-left:18px;margin:0 0 8px">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><div class="row"><button class="btn btn-primary" onclick="document.querySelector('.scrim').click()">OK</button></div>`);
    else toast('Order opened');
  } catch (err) { toast('That file isn’t an order: ' + err.message); }
};

$('#btnSave').onclick = () => save();
$('#btnSheet').onclick = buildSheet;
$('#btnChecklist').onclick = sendChecklist;
if ($('#btnQuote')) $('#btnQuote').onclick = openQuote;
$('#btnMore').onclick = e => openMore(e.currentTarget);
$('#btnNew').onclick = newOrder;
$('#btnOrders').onclick = openOrders;

/* ---------------- shop settings (rate, labor minutes, markup…) ---------------- */
const SETTINGS = 'tbs:settings';
let serverSettings = {};

/* ---------------- your figures: custom figures/trims kept for reuse ----------------
   Saved with the shop settings (on the server when there is one), so every device sees them.
   Removing one from the list never changes an order that already uses it. */
let myItems = [];
async function saveMyItems(change) {
  // re-read first so two devices adding at once don't wipe each other's
  let latest = myItems;
  try {
    const st = await store.detect() === 'server' ? await store.req('GET', '?settings=1') : JSON.parse(localStorage.getItem(SETTINGS) || '{}');
    if (st && Array.isArray(st.customItems)) latest = st.customItems;
  } catch { /* use what we have */ }
  const next = change(latest.slice());
  if (store.mode === 'server') await store.req('POST', '?settings=1', { customItems: next });
  else { const st = JSON.parse(localStorage.getItem(SETTINGS) || '{}'); st.customItems = next; localStorage.setItem(SETTINGS, JSON.stringify(st)); }
  myItems = next; serverSettings.customItems = next;
}
async function loadSettings() {
  try {
    const st = await store.detect() === 'server' ? await store.req('GET', '?settings=1', null, false, false) : JSON.parse(localStorage.getItem(SETTINGS) || '{}');
    serverSettings = st && typeof st === 'object' && !Array.isArray(st) ? st : {};
    myItems = Array.isArray(serverSettings.customItems) ? serverSettings.customItems : [];
    E.applySettings(serverSettings);
    renderList();
  } catch { /* defaults from catalog.js */ }
  $('#rushPct').textContent = `+${RULES.rushPercent}% up-charge`;
  renderPick(); if (editIdx > -1) renderParts();
}
function openSettings() {
  const st = E.currentSettings();
  const m = modal(`<h3>Shop settings</h3><p>Pricing and your customer quote. Saved for every device${store.mode === 'server' ? ' and the command-line tool' : ' on this browser'}.</p>
    <div class="set-grid">
      <label class="fld"><span>Markup (× parts)</span><input class="inp" data-s="markup" type="number" step="0.05" value="${st.markup}"></label>
      <label class="fld"><span>Rush surcharge (%)</span><input class="inp" data-s="rushPercent" type="number" step="5" value="${st.rushPercent}"></label>
      <label class="fld"><span>Shop rate ($/hr) for extra labor</span><input class="inp" data-s="shopRatePerHour" type="number" step="1" value="${st.shopRatePerHour}"></label>
      <label class="fld"><span>Part cost from JDS</span><select class="inp" data-s="priceTier"><option value="single"${st.priceTier === 'single' ? ' selected' : ''}>Less than a case</option><option value="case"${st.priceTier === 'case' ? ' selected' : ''}>Full case price</option></select></label>
    </div>
    <p style="margin:10px 0 0">Price each = parts × markup, rounded up to the next .99. Extra labor is only added where you enter minutes on a trophy.</p>
    <h4>Build minutes per trophy <small style="font-weight:400;color:var(--muted)">for time estimates — not added to the price</small></h4>
    <div class="set-mins">${Object.entries(TYPES).map(([k, x]) => `<label>${esc(x.short)}<input type="number" min="0" data-min="${k}" value="${st.laborMinutes[k] ?? ''}" placeholder="—"></label>`).join('')}</div>
    <h4>Customer quote</h4>
    <div class="set-grid">
      <label class="fld"><span>Business name</span><input class="inp" data-qt="business" value="${esc(st.quote.business)}"></label>
      <label class="fld"><span>Phone</span><input class="inp" data-qt="phone" value="${esc(st.quote.phone)}"></label>
      <label class="fld"><span>Email</span><input class="inp" data-qt="email" value="${esc(st.quote.email)}"></label>
      <label class="fld"><span>Website</span><input class="inp" data-qt="web" value="${esc(st.quote.web)}"></label>
      <label class="fld"><span>Address <small class="fld-hint">optional</small></span><input class="inp" data-qt="address" value="${esc(st.quote.address)}"></label>
      <label class="fld"><span>Quote good for (days)</span><input class="inp" data-qt="validDays" type="number" min="1" value="${esc(st.quote.validDays)}"></label>
    </div>
    <label class="fld"><span>Logo (image link)</span><input class="inp" data-qt="logo" value="${esc(st.quote.logo)}" placeholder="Blank = crown and business name"></label>
    <label class="fld"><span>Usual thank-you message <small class="fld-hint">each order can use its own</small></span><textarea class="inp" data-qt="thanks" rows="2">${esc(st.quote.thanks)}</textarea></label>
    <label class="fld"><span>Terms at the bottom of the quote</span><textarea class="inp" data-qt="terms" rows="2">${esc(st.quote.terms)}</textarea></label>
    <h4>Your cost per 2″ insert</h4>
    <div class="set-mins">${Object.entries(INSERT_TYPES).map(([k, x]) => `<label>${esc(x.label)}<input type="number" min="0" step="0.05" data-ins="${k}" value="${st.insertCost[k] ?? 0}"></label>`).join('')}</div>
    <div class="row"><button class="btn btn-quiet" data-x>Cancel</button><button class="btn btn-primary" data-save>Save settings</button></div>`, { cls: 'dialog wide' });
  m.box.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('x' in b.dataset) return m.close();
    if (!('save' in b.dataset)) return;
    const next = { laborMinutes: {}, insertCost: {}, quote: {} };
    m.box.querySelectorAll('[data-qt]').forEach(i => { next.quote[i.dataset.qt] = i.value; });
    m.box.querySelectorAll('[data-s]').forEach(i => { next[i.dataset.s] = i.type === 'number' ? +i.value : i.value; });
    m.box.querySelectorAll('[data-min]').forEach(i => { next.laborMinutes[i.dataset.min] = i.value === '' ? null : +i.value; });
    m.box.querySelectorAll('[data-ins]').forEach(i => { next.insertCost[i.dataset.ins] = +i.value || 0; });
    try {
      if (await store.detect() === 'server') await store.req('POST', '?settings=1', next);
      else localStorage.setItem(SETTINGS, JSON.stringify({ ...JSON.parse(localStorage.getItem(SETTINGS) || '{}'), ...next }));
      Object.assign(serverSettings, next);
      E.applySettings(next); m.close(); fillHeader(); renderPick(); if (editIdx > -1) renderParts();
      toast('Settings saved');
    } catch (err) { if (!err.cancelled) toast(err.message); }
  });
}
$('#btnSettings').onclick = openSettings;

/* ---------------- picture fit ---------------- */
const trophyUrls = t => [E.itemInfo(t.figure), E.itemInfo(t.trim), E.itemInfo(t.middle)].map(i => i && i.url).filter(Boolean);
const shareBounds = debounce(async () => {
  if (store.mode !== 'server') return;
  try { await store.req('POST', '?settings=1', { artBounds: BOUNDS }, false, false); serverSettings.artBounds = BOUNDS; } catch { /* next time */ }
}, 3000);
async function fitArt(urls) {
  const added = await measure([ART.cup, ART.eagle, ...urls]);
  if (!added) return;
  shareBounds();
  renderList();
  if (editIdx > -1) renderStage();
}

/* ---------------- start ---------------- */
loadDraft();
renderOrder();
loadSettings();
