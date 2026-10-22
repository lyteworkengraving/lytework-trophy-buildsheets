/* ==========================================================================
   LyteWork Trophy Build Sheets — CUSTOMER QUOTE
   A clean, customer-facing quote: one line item per trophy design with its
   picture, plain-English details, quantity, price each and line total; then
   totals, plate text to proof, notes and terms. No SKUs, costs or shop notes.
   ========================================================================== */
import { TYPES, RULES } from './data/catalog.js';
import { specRows, orderCost } from './engine.js';
import { renderTrophySVG, trophyHeight } from './render.js';
import { CROWN, fmtDate } from './brand.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const stripSkus = s => String(s).replace(/\s*\((?:[A-Z]{1,6}[0-9][A-Z0-9.\-]*|replaces [^)]*)\)/g, '').replace(/\s{2,}/g, ' ').trim();

/* Plain-English details for the customer, from the shop's spec rows */
export function customerDetails(t) {
  const T = TYPES[t.type];
  const out = [];
  for (const [k, v] of specRows(t)) {
    if (['Type', 'SKU', 'Quantity'].includes(k)) continue;
    let val = stripSkus(v);
    if (!val || val === '—' || val === 'None') continue;
    if (k === '2″ inserts') { out.push(['Custom insert', '2″ ' + val.replace(/^\d+ × /, '').replace(/ — .*$/, '').toLowerCase() + ' logo insert']); continue; }
    if (k === 'Column color') { out.push(['Columns', val]); continue; }
    if (k === 'Riser') val = val.replace(/ column$/, ' column riser');
    out.push([k, val]);
  }
  if (!T.catalog) {
    const h = Math.round(trophyHeight(t));
    if (h > 0) out.push(['Overall height', `About ${h}″`]);
    out.push(['Engraving', `Engraved plate${t.qty > 1 ? 's' : ''}`]);
  }
  return out;
}

export function quoteHTML(order, { now = new Date() } = {}) {
  const Q = RULES.quote;
  const c = orderCost(order);
  const valid = new Date(now); valid.setDate(valid.getDate() + (+Q.validDays || 30));
  const fmt = d => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const quoteNo = order.orderNo || (order.id ? order.id.toUpperCase() : '');
  const contact = [Q.phone, Q.email, Q.web].filter(Boolean).map(esc).join('<span class="dot">·</span>');

  const lines = c.per.map(({ t, price }, i) => {
    const T = TYPES[t.type];
    const det = customerDetails(t);
    return `<tr class="li">
      <td class="li-art">${renderTrophySVG(t, { plate: true, shadow: false })}</td>
      <td class="li-desc">
        <div class="li-name">${esc(t.label || T.name)}</div>
        ${t.label ? `<div class="li-type">${esc(T.name)}</div>` : ''}
        <dl class="li-spec">${det.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        ${t.customerNotes ? `<p class="li-note">${esc(t.customerNotes)}</p>` : ''}
      </td>
      <td class="num">${t.qty}</td>
      <td class="num">${money(price)}</td>
      <td class="num strong">${money(price * t.qty)}</td>
    </tr>`;
  }).join('');

  // add-on items: your own picture (if any), name, description, price
  const addonLines = c.addons.map(a => `<tr class="li li-addon">
      <td class="li-art">${a.img ? `<div class="addon-pic"><img src="${esc(a.img)}" alt=""></div>` : '<div class="addon-pic none"></div>'}</td>
      <td class="li-desc"><div class="li-name">${esc(a.name)}</div>${a.desc ? `<p class="li-addon-desc">${esc(a.desc)}</p>` : ''}</td>
      <td class="num">${a.qty}</td>
      <td class="num">${money(a.price)}</td>
      <td class="num strong">${money(a.total)}</td>
    </tr>`).join('');

  // plate text to proof — identical plates are grouped ("× 15") so the list stays short
  const plates = order.trophies.map(t => {
    const groups = new Map();
    t.plates.forEach(p => {
      const lines = p.map(x => (x || '').trim()).filter(Boolean);
      if (!lines.length) return;
      const key = lines.join('\n').toUpperCase();
      const g = groups.get(key); if (g) g.n++; else groups.set(key, { lines, n: 1 });
    });
    if (!groups.size) return '';
    const total = [...groups.values()].reduce((a, g) => a + g.n, 0);
    const rows = [...groups.values()].map(g => `<li>${g.lines.map(esc).join('<br>')}${g.n > 1 ? `<span class="pl-n">× ${g.n}</span>` : ''}</li>`);
    return `<div class="pl-group"><h4>${esc(t.label || TYPES[t.type].name)}<span>${total} plate${total > 1 ? 's' : ''}</span></h4><ol>${rows.join('')}</ol></div>`;
  }).join('');
  const count = order.trophies.reduce((s, t) => s + t.qty, 0);

  return `
  <article class="quote">
    <header class="q-head">
      <div class="q-brand">
        ${Q.logo ? `<img class="q-logo" src="${esc(Q.logo)}" alt="${esc(Q.business)}">`
          : `<div class="q-brand-row"><svg viewBox="0 0 5000 5000" aria-hidden="true"><path d="${CROWN}"/></svg><div class="q-biz">${esc(Q.business)}</div></div>`}
        <div class="q-contact">${contact}</div>${Q.address ? `<div class="q-contact">${esc(Q.address)}</div>` : ''}
      </div>
      <div class="q-title"><h1>Quote</h1>
        <dl>${quoteNo ? `<div><dt>Quote #</dt><dd>${esc(quoteNo)}</dd></div>` : ''}
          <div><dt>Date</dt><dd>${fmt(now)}</dd></div>
          <div><dt>Valid until</dt><dd>${fmt(valid)}</dd></div>
          ${order.due ? `<div><dt>Needed by</dt><dd>${esc(fmtDate(order.due, true))}</dd></div>` : ''}</dl>
      </div>
    </header>

    <section class="q-for">
      <div><div class="q-label">Prepared for</div><div class="q-cust">${esc(order.customer || '—')}</div></div>
      <div class="q-sum"><div class="q-label">Summary</div><div>${count} troph${count === 1 ? 'y' : 'ies'} · ${order.trophies.length} design${order.trophies.length === 1 ? '' : 's'}</div></div>
    </section>
    ${order.customerNotes ? `<section class="q-notes"><div class="q-label">Notes</div><p>${esc(order.customerNotes)}</p></section>` : ''}

    <table class="q-lines">
      <thead><tr><th colspan="2">Item</th><th class="num">Qty</th><th class="num">Each</th><th class="num">Total</th></tr></thead>
      <tbody>${lines}${addonLines}</tbody>
    </table>

    <section class="q-totals">
      <table>
        ${c.discount || order.rush ? `<tr><td>Subtotal</td><td class="num">${money(c.subtotal)}</td></tr>` : ''}
        ${order.rush ? `<tr class="muted"><td>Rush service</td><td class="num">included above</td></tr>` : ''}
        ${c.discount ? `<tr><td>Discount (${order.discount}%)</td><td class="num">−${money(c.discount)}</td></tr>` : ''}
        <tr class="grand"><td>Total <small>before tax</small></td><td class="num">${money(c.total)}</td></tr>
        <tr class="tax"><td colspan="2">Sales tax is not included. If it applies, it is added to your invoice.</td></tr>
      </table>
    </section>

    ${plates ? `<section class="q-plates"><div class="pl-cols"><h3>Plate text <small>Please check spelling and wording — plates are engraved exactly as shown.</small></h3>${plates}</div></section>` : ''}

    <footer class="q-foot">
      ${Q.terms ? `<p class="q-terms">${esc(Q.terms)}</p>` : ''}
      ${(order.quoteMessage || Q.thanks) ? `<p class="q-thanks">${esc(order.quoteMessage || Q.thanks)}</p>` : ''}
      <p class="q-small">${esc(Q.business)}${contact ? ' · ' + contact : ''}</p>
    </footer>
  </article>`;
}
