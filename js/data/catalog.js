/* ==========================================================================
   LyteWork Trophy Build Sheets — PARTS CATALOG & RULES
   --------------------------------------------------------------------------
   This is the one file to edit when a SKU, cost, or rule changes.
   Everything else (parts lists, pick list, cut list, renders) reads from here.

   cost: leave null to use your JDS price (js/data/jds.js). Fill it in only to override.
   ========================================================================== */

export const RULES = {
  woodRodExtra: 0.5,          // rods are ½″ longer than the column on wood bases/lids
  tubeLength: 45,             // column stock length (inches)
  kerf: 0.125,                // saw blade kerf (inches)
  maxStockRod: 18,            // longest rod you buy; longer needs two rods + a ferrule
  heights: {
    single:      [4, 9],      // 1-column trophies
    multi:       [9, 24],     // 2/3/4-column, one tier
    tierLower:   [9, 24],     // 2-tier, bottom columns
    tierUpper:   [9, 24],     // 2-tier, top columns
    middleRiser: [1, 12],     // 2-tier, small column under the middle item (½″ steps)
    trimColumn:  [1, 12],     // column under the trim on the base (½″ steps)
    topRiser:    [1, 12]      // column riser under the top figure (½″ steps)
  },
  defaultHeight: { single: 6, multi: 14, tierLower: 16, tierUpper: 14 },
  trimColumnByPosts: { 2: 4, 3: 5, 4: 6 },       // column under the trim on the base
  riserByPosts:      { 2: 'cup6', 3: 'cup7', 4: 'cup8' },
  riserTwoTier:      { 2: 'cup6', 3: 'cup8', 4: 'cup8' },
  // middle item riser on a 2-tier: upper column height − 10, kept within 3–6″
  middleRiserFromUpper: upper => Math.min(6, Math.max(3, upper - 10)),
  /* ---- pricing (the app's Shop settings can override these) ----
     Price each = parts × markup (+ any extra labor you add), rounded up to the next .99.
     Build minutes are for time estimates only; they are not added to the price. */
  laborMinutes: { fob: 5, col1: 8, col1trim: 10, col2: 45, col3: 65, col4: 70,
                  col2t: 60, col3t: 75, col4t: 80, resin: null, cup: null },
  markup: 3.25,
  rushPercent: 25,            // rush jobs add this % to the price
  shopRatePerHour: 90,        // only for extra labor you choose to charge on a trophy
  /* Customer quote: who it's from and the fine print (editable in Shop settings) */
  quote: {
    business: 'LyteWork Engraving LLC',
    phone: '470-253-1050',
    email: 'orders@lytework.net',
    web: 'LyteWork.net',
    address: '',
    validDays: 30,
    logo: 'https://cdn.shopify.com/s/files/1/0590/2244/2570/files/LYTEWORK_LOGO_SS_HORIZ_GD_CROWN_BL_TXT.png?v=1782137128',
    thanks: 'Thank you for the opportunity to make your awards.',
    terms: 'Prices are valid for 30 days. Plate text and logos are confirmed with you before engraving.'
  },
  priceTier: 'single',        // JDS cost to use: 'single' (less than case) or 'case'
  // your cost per 2″ insert you make in-house, by kind
  insertCost: { mylar: 0, sublimated: 0, engraved: 0 }
};

/* Kinds of 2″ insert that go in an insert holder */
export const INSERT_TYPES = {
  mylar:      { label: 'Mylar sticker',   how: 'Print on an 8.5×11 sticker sheet, cut the circles on the Romeo' },
  sublimated: { label: 'Sublimated',      how: 'Sublimate the 2″ circle' },
  engraved:   { label: 'Laser engraved',  how: 'Laser engrave the 2″ circle' }
};

/* Cups used as the riser under the top figure. A column riser uses the same height. */
export const RISER_CUPS = {
  cup6: { label: '6″ cup', cup: 'CUP2606', lid: 'LID2666', height: 6,   rod: 6 },
  cup7: { label: '7″ cup', cup: 'CUP2607', lid: 'LID2677', height: 7.5, rod: 7.5 },
  cup8: { label: '8″ cup', cup: 'CUP2608', lid: 'LID2688', height: 9,   rod: 9 }
};

/* Column colors → JDS 45″ buzz saw column tubing. */
export const COLUMNS = {
  Green:  { sku: 'BZ703', label: 'Green/Gold Round Buzz Saw',  cost: null },
  Red:    { sku: 'BZ701', label: 'Red/Gold Round Buzz Saw',    cost: null },
  Blue:   { sku: 'BZ702', label: 'Blue/Gold Round Buzz Saw',   cost: null },
  Black:  { sku: 'BZ704', label: 'Black/Gold Round Buzz Saw',  cost: null },
  Silver: { sku: 'BZ705', label: 'Silver/Gold Round Buzz Saw', cost: null },
  Gold:   { sku: 'BZ706', label: 'Gold/Gold Round Buzz Saw',   cost: null }
};

/* Everything else, keyed by SKU. Keys starting with "_" have no SKU yet. */
export const PARTS = {
  // Figure-on-base bases
  TM2X3CHCS:  { cat: 'base', cost: null, name: '2″ x 3″ White Centerhole Countersunk Trophy Marble' },
  BK2X3CHCS:  { cat: 'base', cost: null, name: '2″ x 3″ Black Centerhole Countersunk Trophy Marble' },
  BAS33:      { cat: 'base', cost: null, name: '3⅛″ x 3″ Cherry Finish Centerhole Countersunk Slant Front Trophy Base' },
  // 1-column bases
  TM25X4CHCS: { cat: 'base', cost: null, name: '2½″ x 4″ White Centerhole Countersunk Trophy Marble' },
  BK25X4CHCS: { cat: 'base', cost: null, name: '2½″ x 4″ Black Centerhole Countersunk Trophy Marble' },
  BAS34:      { cat: 'base', cost: null, name: '3⅛″ x 4″ Cherry Finish Centerhole Countersunk Slant Front Trophy Base' },
  // 1-column + trim bases
  TM25X52HCS: { cat: 'base', cost: null, name: '2½″ x 5″ White 2-Hole Countersunk Trophy Marble' },
  BK25X52HCS: { cat: 'base', cost: null, name: '2½″ x 5″ Black 2-Hole Countersunk Trophy Marble' },
  BAS36:      { cat: 'base', cost: null, name: '3¾″ x 5¾″ Cherry Finish 2-Hole Countersunk Slant Front Trophy Base' },
  // 2-column bases & lids
  TMSET5BASE: { cat: 'base', cost: null, name: '3″ x 7½″ White 3-Hole Countersunk Trophy Marble Base' },
  TMSET5LID:  { cat: 'base', cost: null, name: '2½″ x 7″ White 3-Hole Trophy Marble Lid' },
  BKSET8BASE: { cat: 'base', cost: null, name: '3″ x 7½″ Black 3-Hole Countersunk Trophy Marble Base' },
  BKSET8LID:  { cat: 'base', cost: null, name: '2½″ x 7″ Black 3-Hole Trophy Marble Lid' },
  VAL1PS201:  { cat: 'base', cost: null, name: '3″ x 8″ x 1″ Value Cherry Finish Economy 2-Post Set' },
  _VAL2LID:   { cat: 'base', cost: null, name: 'Extra 2-Post Lid for VAL1PS201 (2-tier) — SKU needed' },
  // 3-column bases & lids
  PS504:      { cat: 'base', cost: null, name: '12½″ x 12½″ x 1½″ Cherry Finish 3-Post Set' },
  PS504LID:   { cat: 'base', cost: null,  name: '12½″ x 12½″ x ⅝″ Cherry Finish 3-Post Lid' },
  PS502:      { cat: 'base', cost: null, name: '8″ x 8″ x 1½″ Cherry Finish 3-Post Set' },
  PS502LID:   { cat: 'base', cost: null,  name: '8″ x 8″ x ⅝″ Cherry Finish 3-Post Lid' },
  // 4-column bases & lids
  PS403:        { cat: 'base', cost: null, name: '12″ x 12″ x 2⅛″ Cherry Finish 4-Post Set' },
  PS403LID:     { cat: 'base', cost: null,  name: '10½″ x 10½″ x ⅝″ Cherry Finish 4-Post Lid' },
  VAL1PS401:    { cat: 'base', cost: null, name: '9″ x 9″ x 1¾″ Value Cherry Finish Economy 4-Post Set' },
  VAL1PS401LID: { cat: 'base', cost: null,  name: '7¼″ x 7¼″ x ⅝″ Value Cherry Finish Economy 4-Post Lid Only' },
  // Riser cups & lids
  CUP2606: { cat: 'cup', cost: null, name: '5¾″ Gold Plastic Cup' },
  LID2666: { cat: 'cup', cost: null, name: '2⅝″ Gold Plastic Lid for CUP2606/CUP2706' },
  CUP2607: { cat: 'cup', cost: null, name: '7¼″ Gold Plastic Cup' },
  LID2677: { cat: 'cup', cost: null, name: '3¼″ Gold Plastic Lid for CUP2607/CUP2707' },
  CUP2608: { cat: 'cup', cost: null, name: '8¾″ Gold Plastic Cup' },
  LID2688: { cat: 'cup', cost: null, name: '3⅞″ Gold Plastic Lid for CUP2608/CUP2709' },
  // Trim & hardware
  GME4:    { cat: 'eagle',   cost: null, name: '2¼″ Gold Metal Eagle with Feathered Back' },
  H23G:    { cat: 'ring',    cost: null, name: '1¾″ Round Gold Metal Check Ring' },
  FER125S: { cat: 'ferrule', cost: null, name: '1¼″ Steel Hex Ferrule' },
  HEX2:    { cat: 'hexnut',  cost: null, name: '¼″ Flange Hexnut' }

};

/* Rod cost overrides by length, e.g. { 14.5: 0.62 }. Normally JDS prices ROD14.5 etc. */
export const ROD_COSTS = {};

/* Base options per trophy type.
   geometry (inches) is only for drawing the picture:
   w = width, h = thickness, d = depth; lid = the lid's w/h/d; slant = slant front */
const MARBLE_FOB  = { w: 3,    h: 0.75, d: 2   };
const WOOD_FOB    = { w: 3,    h: 1.25, d: 3.1, slant: true };
const MARBLE_1COL = { w: 4,    h: 0.85, d: 2.5 };
const WOOD_1COL   = { w: 4,    h: 1.3,  d: 3.1, slant: true };
const MARBLE_TRIM = { w: 5,    h: 0.85, d: 2.5 };
const WOOD_TRIM   = { w: 5.75, h: 1.3,  d: 3.75, slant: true };
const MARBLE_2COL = { w: 7.5,  h: 0.75, d: 3, lid: { w: 7, h: 0.75, d: 2.5 } };
const WOOD_2COL   = { w: 8,    h: 1,    d: 3, lid: { w: 7, h: 0.625, d: 2.6 } };

export const BASES = {
  fob: [
    { id: 'white',  label: 'White marble', material: 'marble', tex: 'white',  parts: ['TM2X3CHCS'],  geo: MARBLE_FOB },
    { id: 'black',  label: 'Black marble', material: 'marble', tex: 'black',  parts: ['BK2X3CHCS'],  geo: MARBLE_FOB },
    { id: 'cherry', label: 'Cherry wood',  material: 'wood',   tex: 'cherry', parts: ['BAS33'],      geo: WOOD_FOB }
  ],
  col1: [
    { id: 'white',  label: 'White marble', material: 'marble', tex: 'white',  parts: ['TM25X4CHCS'], geo: MARBLE_1COL },
    { id: 'black',  label: 'Black marble', material: 'marble', tex: 'black',  parts: ['BK25X4CHCS'], geo: MARBLE_1COL },
    { id: 'cherry', label: 'Cherry wood',  material: 'wood',   tex: 'cherry', parts: ['BAS34'],      geo: WOOD_1COL }
  ],
  col1trim: [
    { id: 'white',  label: 'White marble', material: 'marble', tex: 'white',  parts: ['TM25X52HCS'], geo: MARBLE_TRIM },
    { id: 'black',  label: 'Black marble', material: 'marble', tex: 'black',  parts: ['BK25X52HCS'], geo: MARBLE_TRIM },
    { id: 'cherry', label: 'Cherry wood',  material: 'wood',   tex: 'cherry', parts: ['BAS36'],      geo: WOOD_TRIM }
  ],
  col2: [
    { id: 'white',  label: 'White marble', material: 'marble', tex: 'white',  parts: ['TMSET5BASE', 'TMSET5LID'], extraLid: 'TMSET5LID', geo: MARBLE_2COL },
    { id: 'black',  label: 'Black marble', material: 'marble', tex: 'black',  parts: ['BKSET8BASE', 'BKSET8LID'], extraLid: 'BKSET8LID', geo: MARBLE_2COL },
    { id: 'cherry', label: 'Cherry wood',  material: 'wood',   tex: 'cherry', parts: ['VAL1PS201'],               extraLid: '_VAL2LID',  geo: WOOD_2COL }
  ],
  col3: [
    { id: 'premium', label: 'Cherry, premium 12½″ (PS504)', material: 'wood', tex: 'cherry', parts: ['PS504'], extraLid: 'PS504LID',
      geo: { w: 12.5, h: 1.5, d: 12.5, lid: { w: 11, h: 0.625, d: 11 } } },
    { id: 'value',   label: 'Cherry, value 8″ (PS502)',     material: 'wood', tex: 'cherry', parts: ['PS502'], extraLid: 'PS502LID',
      geo: { w: 8, h: 1.5, d: 8, lid: { w: 8, h: 0.625, d: 8 } } }
  ],
  col4: [
    { id: 'premium', label: 'Cherry, premium 12″ (PS403)',  material: 'wood', tex: 'cherry', parts: ['PS403'],     extraLid: 'PS403LID',
      geo: { w: 12, h: 2.125, d: 12, lid: { w: 10.5, h: 0.625, d: 10.5 } } },
    { id: 'value',   label: 'Cherry, value 9″ (VAL1PS401)', material: 'wood', tex: 'cherry', parts: ['VAL1PS401'], extraLid: 'VAL1PS401LID',
      geo: { w: 9, h: 1.75, d: 9, lid: { w: 7.25, h: 0.625, d: 7.25 } } }
  ]
};

/* Trophy types. posts = main columns per tier; tiers = 1 or 2. */
export const TYPES = {
  fob:      { name: 'Figure on base',            short: 'Figure on base', posts: 0, tiers: 0, bases: 'fob' },
  col1:     { name: 'Single column',             short: '1-column',       posts: 1, tiers: 1, bases: 'col1' },
  col1trim: { name: 'Single column + trim',      short: '1-column + trim', posts: 1, tiers: 1, bases: 'col1trim' },
  col2:     { name: '2-column trophy',           short: '2-column',       posts: 2, tiers: 1, bases: 'col2' },
  col3:     { name: '3-column trophy',           short: '3-column',       posts: 3, tiers: 1, bases: 'col3' },
  col4:     { name: '4-column trophy',           short: '4-column',       posts: 4, tiers: 1, bases: 'col4' },
  col2t:    { name: '2-column, 2-tier trophy',   short: '2-col 2-tier',   posts: 2, tiers: 2, bases: 'col2' },
  col3t:    { name: '3-column, 2-tier trophy',   short: '3-col 2-tier',   posts: 3, tiers: 2, bases: 'col3' },
  col4t:    { name: '4-column, 2-tier trophy',   short: '4-col 2-tier',   posts: 4, tiers: 2, bases: 'col4' },
  resin:    { name: 'Resin award',               short: 'Resin',          posts: 0, tiers: 0, catalog: 'resin' },
  cup:      { name: 'Cup trophy',                short: 'Cup trophy',     posts: 0, tiers: 0, catalog: 'cup' }
};

/* Order the pick list is grouped in, and the group headings */
export const CATEGORY_ORDER = [
  ['addon',   'Add-on items'],
  ['catalog', 'Resins & cup trophies'],
  ['base',    'Bases & lids'],
  ['column',  'Column tubing'],
  ['figure',  'Figures'],
  ['trim',    'Trims & holders'],
  ['insert',  'Inserts'],
  ['riser',   'Risers'],
  ['cup',     'Cups & cup lids'],
  ['eagle',   'Eagles'],
  ['ring',    'Check rings'],
  ['rod',     'Rods'],
  ['ferrule', 'Ferrules'],
  ['hexnut',  'Hexnuts'],
  ['extra',   'Other parts']
];
