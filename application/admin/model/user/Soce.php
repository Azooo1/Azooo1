<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/21
 * @Time: 16:43
 */
namespace app\admin\model\user;

use app\admin\model\contract\User;
use think\Db;
use think\Model as ThinkModel;

class Soce extends ThinkModel
{
    // 表名
    protected $name = 'user_soce';
    protected $pk = 'id';

    const REWARD_GIVE = 1;
    const EXCHANGE = 2;
    const SYSTEM = 99;

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type = 1, $value = 1)
    {
        $data = [
            self::REWARD_GIVE => __('奖励领取'),
            self::EXCHANGE => __('兑换OCE'),
            self::SYSTEM => __('系统管理'),
        ];
        if ($type == 1) {
            return $data;
        } else {
            return $data[$value];
        }
    }

    /*
     * 账户余额变动
     */
    static public function change_money($user_id, $num, $type, $cont, $from = '', $admin = 0)
    {
        $user = User::where('uid', $user_id)->find();
        $before = empty($user['soce']) ? '0.00000000' : (string)$user['soce'];
        $change = (string)$num;
        $after = bcadd($before, $change, 8);
        $log = [
            'user_id' => $user_id,
            'before' => $before,
            'after' => $after,
            'num' => $change,
            'type' => $type,
            'content' => $cont,
            'create_time' => time(),
            'from' => $from,
            'admin' => $admin
        ];
        Db::startTrans();
        try {
            self::insert($log);
            User::where('uid', $user_id)->setInc('soce', $change);
            Db::commit();
            $result = true;
        } catch (\Exception $e) {
            dump($e->getMessage());
            Db::rollback();
            $result = false;
        }
        return $result;
    }
}
