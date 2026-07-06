<?php

namespace app\common\library;

/**
 * 保护 application/extra/addons.php 不被清缓存写坏
 */
class AddonsConfig
{
    public static function path()
    {
        return CONF_PATH . 'extra' . DS . 'addons.php';
    }

    public static function defaultContent()
    {
        return <<<'PHP'
<?php

return [
    'autoload' => true,
    'hooks'    => [],
    'route'    => [],
];

PHP;
    }

    public static function validate($file = null)
    {
        $file = $file ?: self::path();
        if (!is_file($file) || filesize($file) < 20) {
            return false;
        }
        try {
            $config = include $file;
            return is_array($config) && array_key_exists('autoload', $config);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function restore()
    {
        $file = self::path();
        $dir = dirname($file);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return (bool)file_put_contents($file, self::defaultContent(), LOCK_EX);
    }

    /**
     * 入口文件加载 ThinkPHP 前调用：addons.php 损坏则自动恢复
     */
    public static function guard()
    {
        if (!self::validate()) {
            self::restore();
        }
    }

    /**
     * 安全刷新插件缓存：失败或写坏后回滚默认配置
     */
    public static function safeRefresh()
    {
        $backup = self::validate() ? file_get_contents(self::path()) : self::defaultContent();
        try {
            \think\addons\Service::refresh();
        } catch (\Throwable $e) {
            file_put_contents(self::path(), $backup, LOCK_EX);
            throw $e;
        }
        if (!self::validate()) {
            file_put_contents(self::path(), $backup, LOCK_EX);
            self::restore();
        }
    }
}
