<?php

namespace app\common\library;

use think\Config;

/**
 * 在线客服（SaleSmartly）配置
 */
class HecCustomerService
{
    public static function isEnabled()
    {
        return (string)Config::get('site.customer_service_enabled', '0') === '1';
    }

    public static function scriptUrl()
    {
        $raw = trim((string)Config::get('site.customer_service_script', ''));
        if ($raw === '') {
            return '';
        }
        if (!preg_match('#^https://plugin-code\.salesmartly\.com/js/[a-zA-Z0-9_]+\.js$#', $raw)) {
            return '';
        }
        return $raw;
    }

    public static function toPublicArray()
    {
        $enabled = self::isEnabled();
        $scriptUrl = self::scriptUrl();
        $active = $enabled && $scriptUrl !== '';

        return [
            'enabled'   => $active,
            'scriptUrl' => $active ? $scriptUrl : '',
        ];
    }
}
