/* ==========================================================================
   Art fit — most figure and trim pictures have see-through padding around
   them, so a figure drawn "on" a cup would float above it. This measures where
   each picture's solid part starts and ends (as fractions of the image), so the
   renderer can set the figure's actual base exactly on the cup, ring or base.

   Measurements are kept in the browser and in Shop settings on the server, so
   every device and the command-line tool draw the same way.
   ========================================================================== */
export const BOUNDS = {};          // url → { a: width/height, t, b, l, r } (fractions of the image)
const KEY = 'tbs:art';

export function loadBounds(map) {
  if (map && typeof map === 'object') Object.entries(map).forEach(([u, v]) => { if (v && v.b > v.t) BOUNDS[u] = v; });
}
try { if (typeof localStorage !== 'undefined') loadBounds(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* none yet */ }

function measureOne(url, timeout) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; resolve(v); } };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = img.naturalWidth, H = img.naturalHeight;
        if (!W || !H) return finish(null);
        const k = Math.min(1, 300 / Math.max(W, H));
        const cw = Math.max(1, Math.round(W * k)), ch = Math.max(1, Math.round(H * k));
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, cw, ch);
        const d = ctx.getImageData(0, 0, cw, ch).data;        // throws if the host blocks it
        let t = ch, b = -1, l = cw, r = -1;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
          if (d[(y * cw + x) * 4 + 3] > 28) { if (y < t) t = y; if (y > b) b = y; if (x < l) l = x; if (x > r) r = x; }
        }
        if (b < 0) return finish(null);
        const q = n => Math.round(n * 1000) / 1000;
        finish({ a: q(W / H), t: q(t / ch), b: q((b + 1) / ch), l: q(l / cw), r: q((r + 1) / cw) });
      } catch { finish(null); }
    };
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), timeout);
    img.src = url;
  });
}

/* Measure any of these pictures not measured yet. Resolves to the number of new ones. */
const pending = new Map();
export async function measure(urls, { timeout = 6000 } = {}) {
  if (typeof document === 'undefined') return 0;
  const todo = [...new Set(urls)].filter(u => u && !BOUNDS[u] && !/res\.cloudinary\.com/.test(u));
  if (!todo.length) return 0;
  const results = await Promise.all(todo.map(u => {
    if (!pending.has(u)) pending.set(u, measureOne(u, timeout).then(v => { pending.delete(u); return v; }));
    return pending.get(u).then(v => [u, v]);
  }));
  let added = 0;
  results.forEach(([u, v]) => { if (v && !BOUNDS[u]) { BOUNDS[u] = v; added++; } });
  if (added) { try { localStorage.setItem(KEY, JSON.stringify(BOUNDS)); } catch { /* full */ } }
  return added;
}
