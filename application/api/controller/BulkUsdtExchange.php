<?php

namespace app\api\controller;

use app\admin\model\contract\User;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use app\common\controller\Api;
use think\Config;
use think\Db;

class BulkUsdtExchange extends Api
{
    protected $noNeedLogin = '*';

    public function _initialize()
    {
        parent::_initialize();
        set_time_limit(0);
    }

    public function index()
    {
        $price = Config::get('site.coin_price');
        if (empty($price) || bccomp((string)$price, '0', 6) <= 0) {
            $this->error('coin_price 配置无效');
        }

        $userMoneyMin = Config::get('site.user_money_min');
        $keepUsdt = $userMoneyMin > 0 ? (string)$userMoneyMin : '100';

        $users = User::where('real', 1)
            ->where('status', 1)
            ->where('money', '>', $keepUsdt)
            ->field('uid,address,money,balance')
            ->select();

        if (!$users || count($users) === 0) {
            $this->success('无符合条件用户', ['success' => 0, 'skip' => 0]);
        }

        $records = [];
        $successCount = 0;
        $skipCount = 0;
        $totalUsdt = '0';
        $totalOce = '0';

        foreach ($users as $user) {
            $moneyBalance = $user['money'] === null || $user['money'] === '' ? '0' : (string)$user['money'];
            $num = bcsub($moneyBalance, $keepUsdt, 6);

            if (bccomp($num, '0', 6) <= 0) {
                $skipCount++;
                continue;
            }

            try {
                $result = $this->exchangeLikeBuy((int)$user['uid'], $num);
                $successCount++;
                $totalUsdt = bcadd($totalUsdt, $num, 6);
                $totalOce = bcadd($totalOce, $result['oce'], 6);
                $records[] = $this->buildRecord($user, 'ok', '兑换成功', $moneyBalance, $num, $result['oce']);
            } catch (\Exception $e) {
                $skipCount++;
                $records[] = $this->buildRecord($user, 'skip', $e->getMessage(), $moneyBalance, $num, '0');
            }
        }

        $rootPath = dirname(dirname(dirname(__DIR__)));
        $logFile = $rootPath . DS . 'data' . DS . 'bulk_usdt_exchange.txt';
        $lines = [];
        foreach ($records as $record) {
            $lines[] = sprintf(
                "[%s]\tstatus=%s\tuid=%s\taddress=%s\tmoney=%s\tusdt=%s\toce=%s\tmsg=%s",
                $record['time'],
                $record['status'],
                $record['uid'],
                $record['address'],
                $record['money'],
                $record['num'],
                $record['oce'],
                $record['msg']
            );
        }
        $summary = sprintf(
            "%s\tkeep_usdt=%s\tprice=%s\tsuccess=%d\tskip=%d\ttotal_usdt=%s\ttotal_oce=%s%s",
            date('Y-m-d H:i:s'),
            $keepUsdt,
            $price,
            $successCount,
            $skipCount,
            $totalUsdt,
            $totalOce,
            PHP_EOL
        );
        if ($lines) {
            file_put_contents($logFile, $summary . implode(PHP_EOL, $lines) . PHP_EOL . PHP_EOL, FILE_APPEND | LOCK_EX);
        }

        $this->success('执行完成', [
            'keep_usdt' => $keepUsdt,
            'price' => $price,
            'success' => $successCount,
            'skip' => $skipCount,
            'total_usdt' => $totalUsdt,
            'total_oce' => $totalOce,
            'file' => 'data/bulk_usdt_exchange.txt',
        ]);
    }

    protected function exchangeLikeBuy($uid, $num)
    {
        $price = Config::get('site.coin_price');
        $numUsdt = (string)$num;
        if (bccomp($numUsdt, '0', 6) <= 0) {
            throw new \Exception('兑换数量不能小于0');
        }

        $oceNum = bcdiv($numUsdt, (string)$price, 6);
        $cuser = User::getUserInfo($uid);
        $moneyBalance = empty($cuser) || $cuser['money'] === null || $cuser['money'] === '' ? '0' : (string)$cuser['money'];
        if (bccomp($moneyBalance, $numUsdt, 6) < 0) {
            throw new \Exception('USDT余额不足');
        }

        $userMoneyMin = Config::get('site.user_money_min');
        if ($userMoneyMin > 0 && bccomp(bcsub($moneyBalance, $numUsdt, 6), (string)$userMoneyMin, 6) < 0) {
            throw new \Exception('兑换后USDT账户不能少于' . $userMoneyMin);
        }

        Db::startTrans();
        try {
            if (!Balance::change_money($uid, $oceNum, Balance::BUY, '兑换OCE')) {
                throw new \Exception('OCE变动失败');
            }
            if (!Money::change_money($uid, -1 * $numUsdt, Money::SELL, '兑换OCE')) {
                throw new \Exception('USDT变动失败');
            }
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }

        return ['oce' => $oceNum];
    }

    protected function buildRecord($user, $status, $msg, $money, $num, $oce)
    {
        return [
            'uid' => $user['uid'],
            'address' => $user['address'],
            'status' => $status,
            'msg' => $msg,
            'money' => $money,
            'num' => $num,
            'oce' => $oce,
            'time' => date('Y-m-d H:i:s'),
        ];
    }
}