/* Shared bits used by every page: the LyteWork crown and date formatting.
   Kept separate so the editor and checklist don't depend on the QR-code library. */
export const CROWN = 'M3977.48 2735.76l-582.23 -582.23 582.23 -582.22 582.23 582.22 -582.23 582.23zm-784.57 784.57l-1385.82 0 -1366.78 -1366.8 582.21 -582.22 582.23 582.22 895.27 895.27 738.74 -738.74 582.22 582.23 -628.06 628.04zm-692.9 -1949.02l582.23 582.22 -582.23 582.23 -582.23 -582.23 582.23 -582.22zm1477.47 -313.02l-738.73 738.74 -738.74 -738.74 -738.73 738.74 -738.76 -738.74 -895.24 895.24 1588.17 1588.17 1569.14 0 692.9 -692.91 156.51 -156.51 738.73 -738.76 -895.24 -895.24z';

export function fmtDate(iso, long = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.toLocaleDateString('en-US', long ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' });
}
