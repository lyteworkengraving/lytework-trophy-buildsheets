<?php
/* Trophy Build Sheets — server settings.
   This file is stored in GitHub, so the real passcode is NOT kept here.
   On the server, copy config.local.example.php to config.local.php and put the passcode there.
   Everyone who builds sheets uses it; the phone checklist links do NOT need it. */
if (is_file(__DIR__ . '/config.local.php')) require __DIR__ . '/config.local.php';
if (!defined('TBS_PASSCODE')) define('TBS_PASSCODE', 'change-me'); // saved orders stay locked until a real passcode is set
const TBS_DATA_DIR = __DIR__ . '/data/orders';
