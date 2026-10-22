/* ==========================================================================
   Phone checklist — opens from the QR code or a texted link.
   Checks are saved on this phone only.
   ========================================================================== */
import { decodeOrder, hashCode } from './codec.js';
import * as E from './engine.js';
import { renderTrophySVG } from './render.js';
import { CROWN, fmtDate } from './brand.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const head = document.getElementById('ckHead'), main = document.getElementById('ckMain');
document.getElementById('crownPath').setAttribute('d', CROWN);
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

async function load() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) throw new Error('This link is missing its order. Scan the code on the build sheet again.');
  if (h.startsWith('s=')) {
    const id = h.slice(2);
    const res = await fetch('api/orders.php?check=' + encodeURIComponent(id));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Couldn’t load this checklist.');
    return { code: data.code, key: 's:' + id + ':' + hashCode(data.code) };
  }
  const code = h.replace(/^d=/, '');
  return { code, key: 'd:' + hashCode(code) };
}

try {
  const { code, key } = await load();
  const order = await decodeOrder(code);
  const m = E.orderBOM(order);
  const storeKey = 'tbs:chk:' + key;
  let checked = {};
  try { checked = JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch { /* fresh */ }

  const items = [];
  const row = (id, qty, name, sub, extra = '') => { items.push(id); return `<button class="ck-item${extra ? ' ck-tube' : ''}" role="checkbox" data-id="${esc(id)}" aria-checked="${!!checked[id]}"><span class="cb">${TICK}</span><span class="q">${esc(qty)}</span><span class="n">${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ''}${extra}</span></button>`; };

  const groups = m.groups.map(g => `<h2 class="ck-grp">${esc(g.title)}</h2>${g.lines.map(l => row('p:' + l.key, l.qty, l.name, [l.sku || (l.cat === 'insert' ? 'make in-house' : l.cat === 'addon' ? 'add-on item' : 'SKU needed'), l.note].filter(Boolean).join(' · '))).join('')}`).join('');
  const cuts = m.cuts.map(c => `<h2 class="ck-grp">Cut — ${esc(c.info.label)}${c.info.sku ? ' (' + esc(c.info.sku) + ')' : ''}</h2>${c.tubes.map((tb, i) =>
    row(`c:${c.color}:${i}`, i + 1, `Tube ${i + 1}: ${tb.cuts.map(x => E.inch(x)).join(' + ')}`, `${E.inch(tb.left)} left over`,
      `<span class="bar">${tb.cuts.map(x => `<span style="flex:${x}">${E.inch(x)}</span>`).join('')}${tb.left > 0.2 ? `<span class="rest" style="flex:${tb.left}"></span>` : ''}</span>`)).join('')}`).join('');
  const strip = m.trophies.map(({ t }) => `<figure><div class="art">${renderTrophySVG(t, { plate: false, shadow: false })}</div><b>${t.qty}×</b> ${esc(t.label || E.typeInfo(t.type).short)}</figure>`).join('');

  document.title = `Pick list${order.orderNo ? ' ' + order.orderNo : ''}`;
  const sub = [order.customer, order.due ? 'due ' + fmtDate(order.due) : ''].filter(Boolean).join(' — ');
  head.insertAdjacentHTML('beforeend', `${sub ? `<p>${esc(sub)}</p>` : ''}<div class="ck-prog"><div class="track"><div class="fill" id="ckFill"></div></div><span id="ckCount"></span></div>`);
  head.querySelector('h1').textContent = order.orderNo ? `Order ${order.orderNo}` : 'Pick list';
  main.innerHTML = `<div class="ck-strip">${strip}</div>${groups}${cuts}
    ${m.warnings.length ? `<div class="pl-warn"><b>Heads up</b><ul>${m.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <div class="ck-foot"><button class="btn btn-quiet" id="ckReset">Clear all checks</button></div>`;

  const progress = () => {
    const done = items.filter(id => checked[id]).length;
    document.getElementById('ckFill').style.width = (items.length ? done / items.length * 100 : 0) + '%';
    document.getElementById('ckCount').textContent = done === items.length ? 'All picked' : `${done} of ${items.length}`;
  };
  main.addEventListener('click', e => {
    const b = e.target.closest('.ck-item');
    if (b) {
      const id = b.dataset.id;
      checked[id] = !checked[id]; if (!checked[id]) delete checked[id];
      b.setAttribute('aria-checked', !!checked[id]);
      localStorage.setItem(storeKey, JSON.stringify(checked));
      if (navigator.vibrate) navigator.vibrate(8);
      return progress();
    }
    if (e.target.id === 'ckReset' && confirm('Clear every check on this list?')) {
      checked = {}; localStorage.removeItem(storeKey);
      main.querySelectorAll('.ck-item').forEach(x => x.setAttribute('aria-checked', 'false')); progress();
    }
  });
  progress();
} catch (e) {
  head.querySelector('h1').textContent = 'Can’t open this list';
  main.innerHTML = `<p class="ck-msg">${esc(e.message)}</p>`;
}
