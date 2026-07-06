<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/21
 * @Time: 16:43
 */
namespace app\admin\model\user;

use app\admin\model\contract\User;
use think\Model as ThinkModel;
use think\Db;

class Balance extends ThinkModel
{
    // 表名
    protected $name = 'user_balance';
    protected $pk = 'id';

    const   PLEDGE_REWARD=1;//质押奖励
    const   NODE_REWARD=2;//节点奖励
    const   CASH=3;//取出申请
    const   CASH_BACK=4;//取出退回
    const   SELL=5;//兑换
    const   BUY=6;//兑换
    const   SYSTEM=99;

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type=1,$value=1){
        $data= [
            self::PLEDGE_REWARD=>__('质押奖励'),
            self::NODE_REWARD=>__('节点奖励'),
            self::CASH=>__('取出申请'),
            self::CASH_BACK=>__('取出退回'),
            self::SELL=>__('兑换USDT'),
            self::BUY=>__('兑换OCE'),
            self::SYSTEM=>__('系统管理'),
        ];
        if($type==1){
            return $data;
        }else{
            return $data[$value];
        }
    }

    /*
     * 账户余额变动
     */
    static public function change_money($user_id,$num,$type,$cont,$from='',$admin=0){
        $user=User::where('uid',$user_id)->find();
        $before=$user['balance'];
        $after=$before+$num;
        $log=[
            'user_id'=>$user_id,
            'before'=>$before,
            'after'=>$after,
            'num'=>$num,
            'type'=>$type,
            'content'=>$cont,
            'create_time'=>time(),
            'from'=>$from,
            'admin'=>$admin
        ];
        //插入订单表
        Db::startTrans();
        try {
            self::insert($log);
            User::where('uid',$user_id)->setInc('balance',$num);
            // 提交事务
            Db::commit();
            $result=true;
        } catch (\Exception $e) {
            // 回滚事务
            dump($e->getMessage());
            Db::rollback();
            $result=false;
        }
        return $result;
    }

}
