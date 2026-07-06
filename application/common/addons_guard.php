<?php

if (!defined('DS')) {
    define('DS', DIRECTORY_SEPARATOR);
}
if (!defined('CONF_PATH')) {
    define('CONF_PATH', APP_PATH);
}
// IMPORTANT: ROOT_PATH must be defined before Composer autoload triggers fastadmin-addons
if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(APP_PATH) . DS);
}

require __DIR__ . '/library/AddonsConfig.php';
\app\common\library\AddonsConfig::guard();
