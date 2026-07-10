<?php

namespace app\common\library;

use app\common\model\Config as ConfigModel;

/**
 * 同步 FastAdmin 系统配置到 application/extra/site.php
 */
class HecSiteConfig
{
    public static function refreshSiteFile()
    {
        $config = [];
        foreach (ConfigModel::all() as $row) {
            $value = $row->toArray();
            if (in_array($value['type'], ['selects', 'checkbox', 'images', 'files'], true)) {
                $value['value'] = $value['value'] !== '' ? explode(',', $value['value']) : [];
            }
            if ($value['type'] === 'array') {
                $value['value'] = (array)json_decode($value['value'], true);
            }
            $config[$value['name']] = $value['value'];
        }

        $path = APP_PATH . 'extra' . DS . 'site.php';
        file_put_contents(
            $path,
            '<?php' . "\n\nreturn " . var_export($config, true) . ";\n"
        );

        return $path;
    }
}
