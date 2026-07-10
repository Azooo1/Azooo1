<?php

if (!defined('DS')) {
    define('DS', DIRECTORY_SEPARATOR);
}
if (!defined('CONF_PATH')) {
    define('CONF_PATH', APP_PATH);
}

require __DIR__ . '/library/AddonsConfig.php';
\app\common\library\AddonsConfig::guard();
