<?php

namespace app\common\library;

/**
 * AES加解密
 * Class Client
 * @package common\components\wsd
 */
class Aes
{
    const KEY = "Ib0WrfDth6GlxwpC";
    const CIPHER = "AES-128-CBC";

    /**
     * 加密方法
     * @param $data 加密数据
     * @return string  加密结果
     */
    public static function encrypt($data)
    {
        $ivlen = openssl_cipher_iv_length(self::CIPHER);
        $iv = openssl_random_pseudo_bytes($ivlen);
        $encrypted_data = openssl_encrypt($data,self::CIPHER,self::KEY,OPENSSL_RAW_DATA,$iv);
        return base64_encode($encrypted_data."::".$iv);
    }

    /**
     * 解密方法
     * @param $data  解密数据
     * @return false|string  解密结果
     */
    public static function decrypt($data)
    {
        $data = base64_decode($data);
        $parts = explode("::",$data);
        return openssl_decrypt($parts[0],self::CIPHER,self::KEY,OPENSSL_RAW_DATA,$parts[1]);
    }
}
