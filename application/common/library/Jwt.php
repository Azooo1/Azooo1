<?php

namespace app\common\library;

/**
 * 简易 JWT（HS256），供新前端鉴权使用
 */
class Jwt
{
    public static function encode(array $payload, $expires = 604800)
    {
        $secret = self::secret();
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['iat'] = time();
        $payload['exp'] = time() + (int)$expires;
        $body = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));
        $signature = self::base64UrlEncode(hash_hmac('sha256', $header . '.' . $body, $secret, true));
        return $header . '.' . $body . '.' . $signature;
    }

    public static function decode($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        [$header, $body, $signature] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', $header . '.' . $body, self::secret(), true));
        if (!hash_equals($expected, $signature)) {
            return false;
        }
        $payload = json_decode(self::base64UrlDecode($body), true);
        if (!$payload || empty($payload['exp']) || $payload['exp'] < time()) {
            return false;
        }
        return $payload;
    }

    protected static function secret()
    {
        return \think\Config::get('site.jwt_secret') ?: 'hec-mining-jwt-secret-change-me';
    }

    protected static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    protected static function base64UrlDecode($data)
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
