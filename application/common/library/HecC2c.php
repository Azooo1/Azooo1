<?php

namespace app\common\library;

use app\common\model\HecC2cOrder;
use app\common\model\User;
use think\Config;
use think\Db;
use think\Exception;

/**
 * HEC C2C 卖单（用户挂单，管理员接单/完成）
 */
class HecC2c
{
    public static function config()
    {
        return Config::get('hec.c2c') ?: [];
    }

    public static function listOrders($userId)
    {
        $rows = HecC2cOrder::where('user_id', $userId)->order('id desc')->limit(100)->select();
        $list = [];
        foreach ($rows as $row) {
            $list[] = self::formatOrder($row->toArray());
        }
        return $list;
    }

    public static function createSellOrder($user, $amount, $price)
    {
        $cfg = self::config();
        if (empty($cfg['enabled'])) {
            throw new Exception('C2C 功能未开启');
        }

        $amount = round((float)$amount, 8);
        $price = round((float)$price, 8);
        if ($amount <= 0 || $price <= 0) {
            throw new Exception('数量或单价无效');
        }
        if ($amount < (float)($cfg['minAmount'] ?? 10)) {
            throw new Exception('低于最小卖出数量');
        }
        if ($amount > (float)($cfg['maxAmount'] ?? 1000000)) {
            throw new Exception('超过最大卖出数量');
        }

        $totalPrice = round($amount * $price, 8);
        if ($totalPrice <= 0) {
            throw new Exception('订单总价无效');
        }

        Db::startTrans();
        try {
            $user = User::lock(true)->find($user->id);
            if (bccomp($user->mac_balance, (string)$amount, 8) < 0) {
                throw new Exception('HEC 余额不足');
            }

            $before = $user->mac_balance;
            $user->mac_balance = bcsub($user->mac_balance, (string)$amount, 8);
            $user->save();

            $order = HecC2cOrder::create([
                'user_id'     => $user->id,
                'type'        => 'SELL',
                'currency'    => 'MAC',
                'amount'      => $amount,
                'price'       => $price,
                'total_price' => $totalPrice,
                'status'      => 'PENDING',
            ], true);

            HecBalanceLedger::logHec(
                $user->id,
                'C2C_LOCK',
                bcmul((string)$amount, '-1', 8),
                $before,
                $user->mac_balance,
                'C2C 发布卖单锁定 ' . $amount . ' HEC',
                $order->id,
                'hec_c2c_order'
            );

            Db::commit();
            return self::formatOrder($order->toArray());
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    public static function cancelOrder($user, $orderId)
    {
        Db::startTrans();
        try {
            $order = HecC2cOrder::lock(true)->where('id', (int)$orderId)->find();
            if (!$order || (int)$order->user_id !== (int)$user->id) {
                throw new Exception('订单不存在');
            }
            if ($order->status !== 'PENDING') {
                throw new Exception('只有待接单状态的订单可以取消');
            }

            self::refundHec($order, '用户取消卖单');
            $order->status = 'CANCELLED';
            $order->cancelled_at = time();
            $order->cancel_reason = '用户取消';
            $order->save();

            Db::commit();
            return self::formatOrder($order->toArray());
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 后台变更订单状态
     *
     * @param string $buyerName 接单员用户名，可留空则自动生成
     */
    public static function adminTransition($order, $newStatus, $adminId = 0, $reason = '', $buyerName = '')
    {
        $newStatus = strtoupper(trim((string)$newStatus));
        $allowed = ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];
        if (!in_array($newStatus, $allowed, true)) {
            throw new Exception('无效状态');
        }

        $oldStatus = $order->status;
        if ($oldStatus === $newStatus) {
            return $order;
        }

        Db::startTrans();
        try {
            $order = HecC2cOrder::lock(true)->find($order->id);
            if (!$order) {
                throw new Exception('订单不存在');
            }
            $oldStatus = $order->status;

            if ($newStatus === 'ACCEPTED') {
                if ($oldStatus !== 'PENDING') {
                    throw new Exception('只有待接单订单可标记为已接单');
                }
                $order->status = 'ACCEPTED';
                $order->buyer_name = self::resolveBuyerName($order, $buyerName);
                $order->accepted_by = (int)$adminId ?: null;
                $order->accepted_at = time();
            } elseif ($newStatus === 'COMPLETED') {
                if (!in_array($oldStatus, ['PENDING', 'ACCEPTED'], true)) {
                    throw new Exception('当前状态无法完成订单');
                }
                if ($oldStatus === 'PENDING') {
                    $order->accepted_by = (int)$adminId ?: null;
                    $order->accepted_at = time();
                }
                $order->buyer_name = self::resolveBuyerName($order, $buyerName);
                self::creditUsdt($order);
                $order->status = 'COMPLETED';
                $order->completed_at = time();
            } elseif ($newStatus === 'CANCELLED') {
                if (!in_array($oldStatus, ['PENDING', 'ACCEPTED'], true)) {
                    throw new Exception('当前状态无法取消');
                }
                self::refundHec($order, $reason ?: '管理员取消');
                $order->status = 'CANCELLED';
                $order->cancelled_at = time();
                $order->cancel_reason = $reason ?: '管理员取消';
            } elseif ($newStatus === 'PENDING') {
                throw new Exception('不可回退为待接单');
            }

            $order->save();
            Db::commit();
            return $order;
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    protected static function refundHec($order, $memo)
    {
        if (in_array($order->status, ['COMPLETED', 'CANCELLED'], true)) {
            return;
        }

        $user = User::lock(true)->find($order->user_id);
        if (!$user) {
            throw new Exception('用户不存在');
        }

        $amount = (string)$order->amount;
        $before = $user->mac_balance;
        $user->mac_balance = bcadd($user->mac_balance, $amount, 8);
        $user->save();

        HecBalanceLedger::logHec(
            $user->id,
            'C2C_REFUND',
            $amount,
            $before,
            $user->mac_balance,
            $memo . ' #' . $order->id,
            $order->id,
            'hec_c2c_order'
        );
    }

    protected static function creditUsdt($order)
    {
        if ($order->status === 'COMPLETED') {
            return;
        }

        $user = User::lock(true)->find($order->user_id);
        if (!$user) {
            throw new Exception('用户不存在');
        }

        $amount = (string)$order->total_price;
        $before = $user->usdt_balance;
        $user->usdt_balance = bcadd($user->usdt_balance, $amount, 8);
        $user->save();

        HecBalanceLedger::logUsdc(
            $user->id,
            'C2C_IN',
            $amount,
            $before,
            $user->usdt_balance,
            'C2C 卖单成交 #' . $order->id,
            $order->id,
            'hec_c2c_order'
        );
    }

    public static function formatOrder(array $row, $buyerName = null)
    {
        $buyerName = $buyerName ?: ($row['buyer_name'] ?? null);
        if (!$buyerName && !empty($row['accepted_by'])) {
            $buyerName = Db::name('admin')->where('id', (int)$row['accepted_by'])->value('username');
        }

        return [
            'id'           => (string)$row['id'],
            'userId'       => (string)$row['user_id'],
            'type'         => $row['type'] ?? 'SELL',
            'currency'     => $row['currency'] ?? 'MAC',
            'amount'       => (string)$row['amount'],
            'price'        => (string)$row['price'],
            'totalPrice'   => (string)($row['total_price'] ?? '0'),
            'status'       => $row['status'] ?? 'PENDING',
            'acceptedBy'   => !empty($row['accepted_by']) ? (string)$row['accepted_by'] : null,
            'acceptedAt'   => !empty($row['accepted_at']) ? date('c', (int)$row['accepted_at']) : null,
            'completedAt'  => !empty($row['completed_at']) ? date('c', (int)$row['completed_at']) : null,
            'cancelledAt'  => !empty($row['cancelled_at']) ? date('c', (int)$row['cancelled_at']) : null,
            'cancelReason' => $row['cancel_reason'] ?? null,
            'buyerName'    => $buyerName ?: null,
            'createdAt'    => !empty($row['createtime']) ? date('c', (int)$row['createtime']) : null,
            'updatedAt'    => !empty($row['updatetime']) ? date('c', (int)$row['updatetime']) : null,
        ];
    }

    public static function statusText($status)
    {
        $map = [
            'PENDING'   => '待接单',
            'ACCEPTED'  => '进行中',
            'COMPLETED' => '已完成',
            'CANCELLED' => '已取消',
        ];
        return $map[$status] ?? $status;
    }

    /**
     * 校验接单员用户名：英文字母开头，可含数字与下划线，3-32 位
     */
    public static function normalizeBuyerName($name)
    {
        $name = trim((string)$name);
        if ($name === '') {
            return '';
        }
        if (!preg_match('/^[A-Za-z][A-Za-z0-9_]{2,31}$/', $name)) {
            throw new Exception('接单员用户名须为 3-32 位英文字母开头，可含数字与下划线');
        }
        return $name;
    }

    /** 随机生成参考站风格的英文接单员名 */
    public static function randomBuyerName()
    {
        $prefixes = [
            'trade', 'crypto', 'block', 'diamond', 'moon', 'alpha', 'smart', 'coin',
            'hash', 'pixel', 'quantum', 'flash', 'steel', 'silver', 'golden', 'rapid',
        ];
        $suffixes = [
            'master', 'ninja', 'whale', 'king', 'trader', 'hunter', 'hands', 'vault',
            'wolf', 'fox', 'bull', 'bear', 'node', 'miner', 'shark', 'eagle',
        ];
        $p = $prefixes[array_rand($prefixes)];
        $s = $suffixes[array_rand($suffixes)];
        $num = (string)mt_rand(1, 99);

        $style = mt_rand(0, 2);
        if ($style === 0) {
            return ucfirst($p) . ucfirst($s) . $num;
        }
        if ($style === 1) {
            return strtolower($p) . '_' . strtolower($s) . $num;
        }
        return strtolower($p) . '_' . strtolower($s) . mt_rand(1, 9);
    }

    protected static function resolveBuyerName($order, $buyerName)
    {
        $buyerName = trim((string)$buyerName);
        if ($buyerName !== '') {
            return self::normalizeBuyerName($buyerName);
        }
        $existing = trim((string)($order->getData('buyer_name') ?? ''));
        if ($existing !== '') {
            return $existing;
        }
        return self::randomBuyerName();
    }

    /** 仅更新接单员名称（不改状态） */
    public static function updateBuyerName($order, $buyerName)
    {
        $name = self::normalizeBuyerName($buyerName);
        $order->buyer_name = $name;
        $order->save();
        return $order;
    }
}
