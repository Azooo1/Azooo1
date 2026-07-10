<?php

namespace app\common\library;

use app\common\model\HecBalanceLog;
use app\common\model\UsdcBalanceLog;

/**
 * HEC / USDC 余额流水
 */
class HecBalanceLedger
{
    public static function hecTypeList()
    {
        return [
            'REGISTER_BONUS'  => '注册奖励',
            'MINING_REWARD'   => '挖矿产出',
            'EXCHANGE_OUT'    => '闪兑扣除',
            'C2C_LOCK'        => 'C2C卖单锁定',
            'C2C_REFUND'      => 'C2C退回',
            'WITHDRAW_OUT'    => '提币扣除',
            'WITHDRAW_REFUND' => '提币退回',
            'ADMIN_ADJUST'    => '管理员调整',
        ];
    }

    public static function usdcTypeList()
    {
        return [
            'EXCHANGE_IN'     => '闪兑到账',
            'C2C_IN'          => 'C2C成交到账',
            'WITHDRAW_OUT'    => '提币扣除',
            'WITHDRAW_REFUND' => '提币退回',
            'ADMIN_ADJUST'    => '管理员调整',
        ];
    }

    public static function hecTypeText($type)
    {
        $list = self::hecTypeList();
        return $list[$type] ?? $type;
    }

    public static function usdcTypeText($type)
    {
        $list = self::usdcTypeList();
        return $list[$type] ?? $type;
    }

    public static function logHec($userId, $changeType, $amount, $before, $after, $memo = '', $relatedId = 0, $relatedType = '', $adminId = 0)
    {
        return HecBalanceLog::create([
            'user_id'      => (int)$userId,
            'change_type'  => (string)$changeType,
            'amount'       => $amount,
            'before'       => $before,
            'after'        => $after,
            'memo'         => (string)$memo,
            'related_id'   => (int)$relatedId,
            'related_type' => (string)$relatedType,
            'admin_id'     => (int)$adminId,
        ]);
    }

    public static function logUsdc($userId, $changeType, $amount, $before, $after, $memo = '', $relatedId = 0, $relatedType = '', $adminId = 0)
    {
        return UsdcBalanceLog::create([
            'user_id'      => (int)$userId,
            'change_type'  => (string)$changeType,
            'amount'       => $amount,
            'before'       => $before,
            'after'        => $after,
            'memo'         => (string)$memo,
            'related_id'   => (int)$relatedId,
            'related_type' => (string)$relatedType,
            'admin_id'     => (int)$adminId,
        ]);
    }

    protected static function currentAdminId()
    {
        if (class_exists('\app\admin\library\Auth')) {
            $auth = \app\admin\library\Auth::instance();
            if ($auth->isLogin()) {
                return (int)$auth->id;
            }
        }
        return 0;
    }

    public static function logHecAdjust($userId, $before, $after, $memo = '管理员调整余额')
    {
        $delta = bcsub($after, $before, 8);
        if (bccomp($delta, '0', 8) === 0) {
            return null;
        }
        return self::logHec($userId, 'ADMIN_ADJUST', $delta, $before, $after, $memo, 0, '', self::currentAdminId());
    }

    public static function logUsdcAdjust($userId, $before, $after, $memo = '管理员调整余额')
    {
        $delta = bcsub($after, $before, 8);
        if (bccomp($delta, '0', 8) === 0) {
            return null;
        }
        return self::logUsdc($userId, 'ADMIN_ADJUST', $delta, $before, $after, $memo, 0, '', self::currentAdminId());
    }
}
