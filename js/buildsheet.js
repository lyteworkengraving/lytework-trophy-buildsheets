/* ==========================================================================
   LyteWork Trophy Build Sheets — PRINTABLE SHEET
   Builds the pages as an HTML string (used by sheet.html and the CLI → PDF):
     1. Pick list for the whole order (checkboxes) + column cut list + QR code
     2. Plates
     3. One page per trophy design: picture, parts, how it goes together
   ========================================================================== */
import { TYPES, RULES, INSERT_TYPES } from './data/catalog.js';
import { orderBOM, specRows, inch, itemName } from './engine.js';
import { renderTrophySVG } from './render.js';
import qrcode from './vendor/qrcode.js';

import { CROWN, fmtDate } from './brand.js';
export { CROWN, fmtDate };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');


export function qrSVG(text, cls = 'qr') {
  const q = qrcode(0, 'L');
  q.addData(text);
  q.make();
  const n = q.getModuleCount(), m = 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg class="${cls}" viewBox="0 0 ${n + m * 2} ${n + m * 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

export function buildSheetHTML(order, { checklistUrl = '', generated = new Date() } = {}) {
  const bom = orderBOM(order);
  const n = order.trophies.length;
  const plateCount = order.trophies.reduce((s, t) => s + t.plates.length, 0);
  const due = order.due ? fmtDate(order.due) : '';
  const printed = generated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const head = (sub) => `
    <header class="sh-head">
      <div class="sh-brand"><svg viewBox="0 0 5000 5000" aria-hidden="true"><path d="${CROWN}"/></svg><span>LyteWork Engraving</span></div>
      <div class="sh-sub">${esc(sub)}</div>
      <div class="sh-meta">${order.orderNo ? `<b>Order ${esc(order.orderNo)}</b>` : ''}${order.customer ? `<span>${esc(order.customer)}</span>` : ''}${due ? `<span class="sh-due-sm">Due ${esc(due)}</span>` : ''}</div>
    </header>`;

  /* ---------- page 1: pick list ---------- */
  const strip = bom.trophies.map(({ t }, i) => `
      <figure class="strip-item">
        <div class="strip-art">${renderTrophySVG(t, { plate: false, shadow: false })}</div>
        <figcaption><b>${t.qty}×</b> ${esc(t.label || TYPES[t.type].short)}</figcaption>
      </figure>`).join('');

  const groups = bom.groups.map(g => `
      <tbody>
        <tr class="grp"><th colspan="4">${esc(g.title)}</th></tr>
        ${g.lines.map(l => `<tr><td class="box"><span></span></td><td class="qty">${l.qty}</td><td class="nm">${esc(l.name)}${l.note ? ` <em>${esc(l.note)}</em>` : ''}</td><td class="sku">${l.sku ? esc(l.sku) : l.cat === 'insert' ? '<i>in-house</i>' : l.cat === 'addon' ? '<i>add-on</i>' : '<i>SKU needed</i>'}</td></tr>`).join('')}
      </tbody>`).join('');

  const cuts = bom.cuts.map(c => `
      <div class="cut">
        <div class="cut-h"><b>${esc(c.info.label)}</b> ${c.info.sku ? esc(c.info.sku) : '<i>SKU needed</i>'} <span>${c.tubes.length} tube${c.tubes.length > 1 ? 's' : ''} · cuts: ${c.pieces.map(p => `${p.count} × ${inch(p.len)}`).join(', ')}</span></div>
        ${c.tubes.map((tb, i) => `
          <div class="tube"><span class="box"><span></span></span><span class="tube-n">Tube ${i + 1}</span>
            <span class="bar">${tb.cuts.map(len => `<span class="seg" style="flex:${len}">${inch(len)}</span>`).join('')}${tb.left > 0.2 ? `<span class="seg rest" style="flex:${tb.left}">${inch(tb.left)}</span>` : ''}</span>
          </div>`).join('')}
      </div>`).join('');

  const warns = bom.warnings.length ? `<div class="warn"><b>Heads up</b><ul>${bom.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '';

  const page1 = `
  <section class="page page-pick">
    ${head('Build sheet')}
    <div class="pick-top">
      <div class="pick-title">
        <h1>${order.orderNo ? 'Order ' + esc(order.orderNo) : 'Trophy order'}</h1>
        ${order.customer ? `<p class="cust">${esc(order.customer)}</p>` : ''}
        <dl class="facts">
          ${due ? `<div><dt>Due</dt><dd>${esc(fmtDate(order.due, true))}</dd></div>` : ''}
          <div><dt>Trophies</dt><dd>${bom.count} (${n} design${n > 1 ? 's' : ''})</dd></div>
          <div><dt>Plates</dt><dd>${plateCount}</dd></div>
          <div><dt>Printed</dt><dd>${printed}</dd></div>
        </dl>
        ${order.notes ? `<p class="order-notes">${esc(order.notes)}</p>` : ''}
        ${order.customerNotes ? `<p class="order-notes cust-notes"><b>Customer notes</b>${esc(order.customerNotes)}</p>` : ''}
      </div>
      ${checklistUrl ? `<div class="qr-box">${qrSVG(checklistUrl)}<p>Scan for the phone checklist</p></div>` : ''}
    </div>
    <div class="strip">${strip}</div>
    <h2>Pick list <small>${bom.lines.length} lines · everything for all ${bom.count} trophies</small></h2>
    <table class="pick">${groups}</table>
    ${cuts ? `<h2 class="cuts-h">Column cuts <small>${RULES.tubeLength}″ tubes, ⅛″ kerf allowed per cut</small></h2>${cuts}` : ''}
    ${warns}
  </section>`;

  /* ---------- page 2: plates ---------- */
  const plateBlocks = order.trophies.map((t, i) => {
    const rows = t.plates.map((p, j) => {
      const empty = !p.some(x => x && x.trim());
      return `<tr class="${empty ? 'empty' : ''}"><td class="box"><span></span></td><td class="pn">${j + 1}</td>${empty ? '<td colspan="3" class="none">No text yet</td>' : p.map(x => `<td>${esc(x) || '<span class="dash">—</span>'}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="plate-block">
      <h3>Trophy ${i + 1}: ${esc(t.label || TYPES[t.type].name)} <span>${t.plates.length} plate${t.plates.length > 1 ? 's' : ''}</span></h3>
      <table class="plates"><thead><tr><th></th><th>#</th><th>Line 1</th><th>Line 2</th><th>Line 3</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }).join('');
  /* 2″ inserts for holders, grouped by how they're made */
  const ins = bom.trophies.filter(x => x.bom.inserts).map(({ t, bom: tb }, i) => ({ t, n: tb.inserts * t.qty, idx: order.trophies.indexOf(t) + 1 }));
  const byType = {};
  ins.forEach(x => { (byType[x.t.insert.type] = byType[x.t.insert.type] || []).push(x); });
  const insertBlock = ins.length ? `
    <h2 class="ins-h">2″ inserts <small>${ins.reduce((a, x) => a + x.n, 0)} to make for the insert holders</small></h2>
    ${Object.entries(byType).map(([ty, list]) => `
      <div class="plate-block">
        <h3>${esc(INSERT_TYPES[ty].label)} <span>${esc(INSERT_TYPES[ty].how)}</span></h3>
        <table class="plates ins"><thead><tr><th></th><th>Qty</th><th>Trophy</th><th>Logo / artwork</th></tr></thead><tbody>
        ${list.map(x => `<tr><td class="box"><span></span></td><td class="pn">${x.n}</td><td class="tr">Trophy ${x.idx}: ${esc(x.t.label || TYPES[x.t.type].name)}</td><td class="art">${x.t.insert.art ? esc(x.t.insert.art) : '<span class="none">Not given yet</span>'}</td></tr>`).join('')}
        </tbody></table>
      </div>`).join('')}` : '';
  const addons = (order.addons || []).filter(x => x.name && x.qty > 0);
  const addonBlock = addons.length ? `
    <h2 class="ins-h">Add-on items <small>${addons.reduce((n, x) => n + x.qty, 0)} to make — not part of any trophy</small></h2>
    <div class="ao-list">${addons.map(x => `<div class="ao"><span class="box"><span></span></span>
      <div class="ao-pic">${x.img ? `<img src="${esc(x.img)}" alt="">` : ''}</div>
      <div class="ao-txt"><b>${x.qty} × ${esc(x.name)}</b>${x.desc ? `<p>${esc(x.desc)}</p>` : ''}</div></div>`).join('')}</div>` : '';
  const page2 = `
  <section class="page page-plates">
    ${head('Plates')}
    <h2>Plates <small>${plateCount} to engrave — start these while the first trophies go together</small></h2>
    ${plateBlocks}
    ${insertBlock}
    ${addonBlock}
  </section>`;

  /* ---------- trophy pages ---------- */
  const pages = bom.trophies.map(({ t, bom: tb }, i) => {
    const { svg, heightIn } = renderTrophySVG(t, { dims: true, withInfo: true, className: 'tp-svg' });
    const spec = specRows(t).filter(([k]) => k !== 'Quantity' && k !== 'Type').map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const parts = tb.lines.map(l => `<tr><td class="qty">${l.qty}</td>${t.qty > 1 ? `<td class="qty tot">${l.qty * t.qty}</td>` : ''}<td class="nm">${esc(l.name)}${l.note ? ` <em>${esc(l.note)}</em>` : ''}</td><td class="sku">${l.sku ? esc(l.sku) : l.cat === 'insert' ? '<i>in-house</i>' : '<i>—</i>'}</td></tr>`).join('');
    const posts = tb.posts.map(p => `<li><b>${p.count > 1 ? p.count + ' × ' : ''}${esc(p.title)}</b><span>${esc(p.detail)}</span></li>`).join('');
    const w = tb.warnings.length ? `<div class="warn"><ul>${tb.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    return `
  <section class="page page-trophy">
    ${head(`Trophy ${i + 1} of ${n}`)}
    <div class="tp-title">
      <div><h1>${esc(t.label || TYPES[t.type].name)}</h1>${t.label ? `<p class="tp-type">${esc(TYPES[t.type].name)}</p>` : ''}</div>
      <div class="tp-qty"><b>${t.qty}</b><span>to build</span></div>
    </div>
    <div class="tp-body">
      <div class="tp-art">${svg}<p class="tp-height">About ${Math.round(heightIn)}″ tall</p></div>
      <div class="tp-info">
        <dl class="spec">${spec}</dl>
        <h3>Parts ${t.qty > 1 ? `<span>each, and for all ${t.qty}</span>` : '<span>for this trophy</span>'}</h3>
        <table class="parts"><thead><tr><th>Each</th>${t.qty > 1 ? `<th>All ${t.qty}</th>` : ''}<th>Part</th><th>SKU</th></tr></thead><tbody>${parts}</tbody></table>
      </div>
      <div class="tp-foot">
        ${posts ? `<h3>How it goes together</h3><ul class="posts">${posts}</ul>` : ''}
        ${t.notes ? `<h3>Notes</h3><p class="notes">${esc(t.notes)}</p>` : ''}
        ${t.customerNotes ? `<h3>Customer notes</h3><p class="notes cust-notes">${esc(t.customerNotes)}</p>` : ''}
        ${w}
      </div>
    </div>
  </section>`;
  }).join('');

  return page1 + page2 + pages;
}

/* Full standalone HTML document (used by the CLI to print a PDF). */
export function sheetDocument(order, { css = '', checklistUrl = '', title = '' } = {}) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(title || 'Build sheet')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css}</style></head><body class="sheet-body">${buildSheetHTML(order, { checklistUrl })}</body></html>`;
}
