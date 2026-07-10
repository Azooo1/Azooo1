<?php

namespace app\api\controller;

use app\admin\model\contract\User;
use app\common\controller\Api;
use think\Db;

class RandomUsdtBonus extends Api
{
    protected $noNeedLogin = '*';

    public function _initialize()
    {
        parent::_initialize();
        set_time_limit(0);
    }

    public function index()
    {
        $users = User::where('real', 1)
            ->where('status', 1)
            ->where('money', '>=', 100)
            ->field('uid,address,money')
            ->select();

        if (!$users || count($users) === 0) {
            $this->success('无符合条件用户', ['count' => 0, 'total_add' => '0']);
        }

        $records = [];
        $totalAdded = '0';

        Db::startTrans();
        try {
            foreach ($users as $user) {
                $before = (string)$user['money'];
                $add = bcdiv((string)mt_rand(10000, 20000), '100', 2);
                User::where('uid', $user['uid'])->setInc('money', $add);
                $records[] = [
                    'uid' => $user['uid'],
                    'address' => $user['address'],
                    'before' => $before,
                    'add' => $add,
                    'after' => bcadd($before, $add, 6),
                    'time' => date('Y-m-d H:i:s'),
                ];
                $totalAdded = bcadd($totalAdded, $add, 6);
            }
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            $this->error('执行失败: ' . $e->getMessage());
        }

        $rootPath = dirname(dirname(dirname(__DIR__)));
        $logFile = $rootPath . DS . 'data' . DS . 'random_usdt_bonus.txt';
        $lines = [];
        foreach ($records as $record) {
            $lines[] = sprintf(
                "[%s]\tuid=%s\taddress=%s\tbefore=%s\tadd=%s\tafter=%s",
                $record['time'],
                $record['uid'],
                $record['address'],
                $record['before'],
                $record['add'],
                $record['after']
            );
        }
        $summary = sprintf(
            "%s\ttotal_users=%d\ttotal_add=%s%s",
            date('Y-m-d H:i:s'),
            count($records),
            $totalAdded,
            PHP_EOL
        );
        file_put_contents($logFile, $summary . implode(PHP_EOL, $lines) . PHP_EOL . PHP_EOL, FILE_APPEND | LOCK_EX);

        $this->success('执行完成', [
            'count' => count($records),
            'total_add' => $totalAdded,
            'file' => 'data/random_usdt_bonus.txt',
        ]);
    }
}
