<?php
/* ==========================================================================
   Trophy Build Sheets — saved orders API (PHP 8)
     GET    orders.php?list=1        list saved orders           (passcode)
     GET    orders.php?id=ID         one order                   (passcode)
     POST   orders.php               save order JSON, returns id (passcode)
     DELETE orders.php?id=ID         move order to trash         (passcode)
     GET    orders.php?check=ID      phone checklist data only   (public)
     GET    orders.php?settings=1    shop settings (rate, labor…)  (passcode)
     POST   orders.php?settings=1    save shop settings           (passcode)
   Passcode is sent in the X-Passcode header. Set it in config.php.
   ========================================================================== */
declare(strict_types=1);
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(int $code, array $body): never { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function valid_id(string $id): bool { return (bool)preg_match('/^\d{6}-[a-f0-9]{8}$/', $id); }
function path_for(string $id): string { return TBS_DATA_DIR . '/' . $id . '.json'; }

if (!is_dir(TBS_DATA_DIR) && !mkdir(TBS_DATA_DIR, 0750, true)) out(500, ['error' => 'Could not create the data folder. Check permissions on api/data.']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* Public: checklist data for a saved order (no plates, no notes, no prices). */
if ($method === 'GET' && isset($_GET['check'])) {
  $id = (string)$_GET['check'];
  if (!valid_id($id) || !is_file(path_for($id))) out(404, ['error' => 'Checklist not found. It may have been deleted.']);
  $o = json_decode((string)file_get_contents(path_for($id)), true);
  if (empty($o['checkCode'])) out(404, ['error' => 'This order was saved without checklist data. Open it and save again.']);
  out(200, ['code' => $o['checkCode']]);
}

if (TBS_PASSCODE === 'change-me') out(503, ['error' => 'Set a passcode in api/config.php before using saved orders.']);
if (!hash_equals(TBS_PASSCODE, (string)($_SERVER['HTTP_X_PASSCODE'] ?? ''))) out(401, ['error' => 'Wrong passcode.']);

if ($method === 'GET' && isset($_GET['ping'])) out(200, ['ok' => true]);

/* Shop settings: one small JSON file beside the orders folder */
$settingsFile = dirname(TBS_DATA_DIR) . '/settings.json';
if (isset($_GET['settings'])) {
  if ($method === 'GET') out(200, is_file($settingsFile) ? (json_decode((string)file_get_contents($settingsFile), true) ?: []) : []);
  if ($method === 'POST') {
    $st = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($st)) out(400, ['error' => 'Those settings could not be read.']);
    // merge: shop settings, figure SKUs and picture measurements are saved separately
    $old = is_file($settingsFile) ? (json_decode((string)file_get_contents($settingsFile), true) ?: []) : [];
    $st = array_merge(is_array($old) ? $old : [], $st);
    $st['updated'] = gmdate('c');
    if (file_put_contents($settingsFile, json_encode($st, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) out(500, ['error' => 'Could not save settings. Check permissions on api/data.']);
    out(200, ['ok' => true, 'updated' => $st['updated']]);
  }
}

if ($method === 'GET' && isset($_GET['list'])) {
  $rows = [];
  foreach (glob(TBS_DATA_DIR . '/*.json') ?: [] as $f) {
    $o = json_decode((string)file_get_contents($f), true);
    if (!is_array($o)) continue;
    $count = 0; foreach (($o['trophies'] ?? []) as $t) $count += max(1, (int)($t['qty'] ?? 1));
    $rows[] = ['id' => $o['id'] ?? basename($f, '.json'), 'orderNo' => $o['orderNo'] ?? '', 'customer' => $o['customer'] ?? '',
      'due' => $o['due'] ?? '', 'updated' => $o['updated'] ?? '', 'designs' => count($o['trophies'] ?? []), 'count' => $count];
  }
  usort($rows, fn($a, $b) => strcmp($b['updated'], $a['updated']));
  out(200, ['orders' => array_slice($rows, 0, 500)]);
}

if ($method === 'GET' && isset($_GET['id'])) {
  $id = (string)$_GET['id'];
  if (!valid_id($id) || !is_file(path_for($id))) out(404, ['error' => 'Order not found.']);
  echo file_get_contents(path_for($id)); exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  if ($raw === false || strlen($raw) > 3_000_000) out(413, ['error' => 'Order is too large (3 MB max). Remove uploaded images.']);
  $o = json_decode($raw, true);
  if (!is_array($o) || !isset($o['trophies']) || !is_array($o['trophies'])) out(400, ['error' => 'That is not an order.']);
  $id = (string)($o['id'] ?? '');
  if (!valid_id($id)) $id = date('ymd') . '-' . bin2hex(random_bytes(4));
  $o['id'] = $id;
  $o['updated'] = gmdate('c');
  $tmp = path_for($id) . '.tmp';
  if (file_put_contents($tmp, json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX) === false || !rename($tmp, path_for($id)))
    out(500, ['error' => 'Could not save. Check permissions on api/data.']);
  out(200, ['id' => $id, 'updated' => $o['updated']]);
}

if ($method === 'DELETE' && isset($_GET['id'])) {
  $id = (string)$_GET['id'];
  if (!valid_id($id) || !is_file(path_for($id))) out(404, ['error' => 'Order not found.']);
  $trash = TBS_DATA_DIR . '/trash';
  if (!is_dir($trash)) mkdir($trash, 0750, true);
  rename(path_for($id), $trash . '/' . $id . '.json');
  out(200, ['ok' => true]);
}

out(405, ['error' => 'Not supported.']);
