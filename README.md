# LyteWork Trophy Build Sheets

Internal tool for LyteWork Engraving LLC that turns trophy designs (from the buildatrophy.com configurator) into build sheets, a master parts pick list, plate pages, quotes, and a phone checklist with QR codes.

- **Hosting:** Hostinger (PHP 8.1+)
- **Part of:** LyteWork Systems / LyteWork Hub

## What's in this repo
| Path | What it is |
|---|---|
| `index.html` | Main builder |
| `sheet.html`, `quote.html`, `checklist.html`, `skus.html` | Build sheet, customer quote, phone checklist, and SKU matching pages |
| `js/` | App code: `engine.js` (parts and cost logic), `render.js` (trophy drawings), `buildsheet.js`, `quote.js`, `checklist.js`, `codec.js`, `artfit.js`, `skumatch.js`, `brand.js` |
| `js/data/` | Parts catalogs: JDS (imported from JDS CSV exports, includes costs), resins, figures, cups |
| `js/vendor/qrcode.js` | Third-party QR code library |
| `css/` | Styles |
| `api/orders.php` | Saves and loads orders and shop settings (passcode protected; checklist data is public) |
| `api/config.php` | Server settings. **The real passcode is not here** — see below. |

## What is NOT in this repo (server only)
- `api/data/orders/`: saved orders (and `trash/`)
- `api/data/settings.json`: shop settings, figure SKUs, and picture measurements saved from the app
- `api/config.local.php`: the shop passcode

Back up `api/data/` separately. It is the business data; this repo is only the app.

## Note
`js/data/jds.js` contains JDS costs. It's safe in this private repo, but on the live site any `.js` file can be downloaded by anyone who knows the address.
