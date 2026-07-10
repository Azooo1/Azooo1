<?php

namespace app\common\library;

use app\common\model\HecExchange;
use app\common\model\HecPriceLog;
use app\common\model\HecWithdraw;
use app\common\library\HecBalanceLedger;
use app\common\model\User;
use think\Config;
use think\Db;
use think\Exception;

class HecFinance
{
    public static function exchangeConfig()
    {
        return Config::get('hec.exchange') ?: [];
    }

    public static function withdrawConfig()
    {
        return Config::get('hec.withdraw') ?: [];
    }

    public static function currentPrice()
    {
        $base = (float)(Config::get('hec.hec_price') ?: 0.27);
        $latest = HecPriceLog::order('log_date desc')->value('price');
        return $latest ? (float)$latest : $base;
    }

    public static function priceTrend()
    {
        $rows = HecPriceLog::order('log_date desc')->limit(2)->column('price');
        if (count($rows) < 2) {
            return 0.002;
        }
        return round((float)$rows[0] - (float)$rows[1], 6);
    }

    public static function ensurePriceHistory($days = 30)
    {
        $days = max(1, min(365, (int)$days));
        $base = self::currentPrice();
        $count = HecPriceLog::count();
        if ($count >= $days) {
            return;
        }
        $now = time();
        for ($i = $days; $i >= 0; $i--) {
            $date = date('Y-m-d', $now - $i * 86400);
            $exists = HecPriceLog::where('log_date', $date)->find();
            if ($exists) {
                continue;
            }
            $noise = (mt_rand(-50, 50) / 10000);
            $price = max(0.01, round($base + $noise, 8));
            HecPriceLog::create(['price' => $price, 'log_date' => $date, 'createtime' => $now]);
        }
    }

    public static function priceHistory($days)
    {
        self::ensurePriceHistory($days);
        $since = date('Y-m-d', time() - ((int)$days - 1) * 86400);
        $rows = HecPriceLog::where('log_date', '>=', $since)->order('log_date asc')->select();
        $data = [];
        foreach ($rows as $row) {
            $data[] = ['date' => $row['log_date'], 'price' => (float)$row['price']];
        }
        return $data;
    }

    public static function listExchanges($userId)
    {
        $rows = HecExchange::where('user_id', $userId)->order('id desc')->limit(50)->select();
        $list = [];
        foreach ($rows as $row) {
            $list[] = self::formatExchange($row->toArray());
        }
        return $list;
    }

    public static function executeExchange($user, $fromAmount, $toCurrency = 'USDT')
    {
        $cfg = self::exchangeConfig();
        if (empty($cfg['enabled'])) {
            throw new Exception('闪兑功能未开启');
        }
        $fromAmount = round((float)$fromAmount, 8);
        if ($fromAmount <= 0) {
            throw new Exception('兑换数量无效');
        }
        if ($fromAmount < (float)$cfg['minAmount']) {
            throw new Exception('低于最小兑换数量');
        }
        if ($fromAmount > (float)$cfg['maxAmount']) {
            throw new Exception('超过最大兑换数量');
        }
        $toCurrency = strtoupper($toCurrency);
        if ($toCurrency === 'USDC') {
            $toCurrency = 'USDT';
        }
        if ($toCurrency !== 'USDT') {
            throw new Exception('不支持的目标币种');
        }

        $rate = (float)($cfg['macToUsdtRate'] ?? self::currentPrice());
        $feeRate = (float)($cfg['feeRate'] ?? 0);
        $fee = round($fromAmount * $feeRate, 8);
        $net = $fromAmount - $fee;
        $toAmount = round($net * $rate, 8);

        $todayStart = strtotime(date('Y-m-d'));
        $todaySum = HecExchange::where('user_id', $user->id)->where('createtime', '>=', $todayStart)->sum('from_amount');
        if ($todaySum + $fromAmount > (float)$cfg['dailyLimit']) {
            throw new Exception('超过每日兑换限额');
        }

        Db::startTrans();
        try {
            $user = User::lock(true)->find($user->id);
            if (bccomp($user->mac_balance, $fromAmount, 8) < 0) {
                throw new Exception('HEC 余额不足');
            }
            $hecBefore = $user->mac_balance;
            $usdtBefore = $user->usdt_balance;
            $user->mac_balance = bcsub($user->mac_balance, $fromAmount, 8);
            $user->usdt_balance = bcadd($user->usdt_balance, $toAmount, 8);
            $user->save();

            $record = HecExchange::create([
                'user_id'       => $user->id,
                'from_currency' => 'MAC',
                'to_currency'   => $toCurrency,
                'from_amount'   => $fromAmount,
                'to_amount'     => $toAmount,
                'rate'          => $rate,
                'fee'           => $fee,
            ], true);

            HecBalanceLedger::logHec(
                $user->id,
                'EXCHANGE_OUT',
                bcmul((string)$fromAmount, '-1', 8),
                $hecBefore,
                $user->mac_balance,
                '闪兑 ' . $fromAmount . ' HEC',
                $record->id,
                'hec_exchange'
            );
            HecBalanceLedger::logUsdc(
                $user->id,
                'EXCHANGE_IN',
                (string)$toAmount,
                $usdtBefore,
                $user->usdt_balance,
                '闪兑到账 ' . $toAmount . ' USDT',
                $record->id,
                'hec_exchange'
            );

            Db::commit();
            return [
                'exchange' => self::formatExchange($record->toArray()),
                'detail'   => [
                    'fromAmount' => (string)$fromAmount,
                    'toAmount'   => (string)$toAmount,
                ],
            ];
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    public static function listWithdrawals($userId)
    {
        $rows = HecWithdraw::where('user_id', $userId)->order('id desc')->limit(50)->select();
        $list = [];
        foreach ($rows as $row) {
            $list[] = self::formatWithdraw($row->toArray());
        }
        return $list;
    }

    public static function submitWithdraw($user, array $payload)
    {
        $cfg = self::withdrawConfig();
        $amount = round((float)($payload['amount'] ?? 0), 8);
        $currency = strtoupper($payload['currency'] ?? 'USDT');
        if ($currency === 'USDC') {
            $currency = 'USDT';
        }
        $chain = strtoupper($payload['chain'] ?? 'TRON');
        $toAddress = trim($payload['toAddress'] ?? '');

        if ($amount <= 0) {
            throw new Exception('提币数量无效');
        }
        if ($amount < (float)$cfg['minAmount']) {
            throw new Exception('低于最小提币数量');
        }
        if ($amount > (float)$cfg['maxAmount']) {
            throw new Exception('超过最大提币数量');
        }
        if (!$toAddress) {
            throw new Exception('提币地址无效');
        }
        if ($chain === 'TRON' || HecTron::isTronAddress($toAddress)) {
            $chain = 'TRON';
            if (!HecTron::isTronAddress($toAddress)) {
                throw new Exception('提币地址无效，请使用 TRON 钱包地址');
            }
        } elseif (!preg_match('/^0x[a-fA-F0-9]{40}$/', $toAddress)) {
            throw new Exception('提币地址无效');
        }
        if (!in_array($currency, ['USDT', 'MAC'], true)) {
            throw new Exception('不支持的币种');
        }

        $feeRate = (float)($cfg['feeRate'] ?? 0);
        $fee = max((float)$cfg['minFee'], min((float)$cfg['maxFee'], round($amount * $feeRate, 8)));
        $net = $amount - $fee;
        if ($net <= 0) {
            throw new Exception('提币金额扣除手续费后无效');
        }

        Db::startTrans();
        try {
            $user = User::lock(true)->find($user->id);
            $field = $currency === 'USDT' ? 'usdt_balance' : 'mac_balance';
            if (bccomp($user->$field, $amount, 8) < 0) {
                throw new Exception('余额不足');
            }
            $before = $user->$field;
            $user->$field = bcsub($user->$field, $amount, 8);
            $user->save();

            $record = HecWithdraw::create([
                'user_id'       => $user->id,
                'amount'        => $net,
                'deduct_amount' => $amount,
                'currency'      => $currency,
                'to_address'    => $toAddress,
                'chain'         => $chain,
                'status'        => 'PENDING',
                'review_note'   => null,
            ], true);

            if ($currency === 'MAC') {
                HecBalanceLedger::logHec(
                    $user->id,
                    'WITHDRAW_OUT',
                    bcmul((string)$amount, '-1', 8),
                    $before,
                    $user->mac_balance,
                    '申请提币 ' . $amount . ' HEC',
                    $record->id,
                    'hec_withdraw'
                );
            } elseif ($currency === 'USDT') {
                HecBalanceLedger::logUsdc(
                    $user->id,
                    'WITHDRAW_OUT',
                    bcmul((string)$amount, '-1', 8),
                    $before,
                    $user->usdt_balance,
                    '申请提币 ' . $amount . ' USDT',
                    $record->id,
                    'hec_withdraw'
                );
            }

            Db::commit();
            return self::formatWithdraw($record->toArray());
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    protected static function formatExchange($row)
    {
        return [
            'id'           => (string)$row['id'],
            'fromCurrency' => $row['from_currency'],
            'toCurrency'   => $row['to_currency'],
            'fromAmount'   => (string)$row['from_amount'],
            'toAmount'     => (string)$row['to_amount'],
            'rate'         => (string)$row['rate'],
            'createdAt'    => date('c', $row['createtime']),
        ];
    }

    protected static function formatWithdraw($row)
    {
        return [
            'id'         => (string)$row['id'],
            'amount'     => (string)$row['amount'],
            'currency'   => $row['currency'],
            'toAddress'  => $row['to_address'],
            'chain'      => $row['chain'],
            'status'     => $row['status'],
            'reviewNote' => $row['review_note'] ?? null,
            'createdAt'  => date('c', (int)($row['createtime'] ?? time())),
        ];
    }
}
