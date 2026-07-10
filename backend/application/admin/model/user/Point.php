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

class Point extends ThinkModel
{
    // 表名
    protected $name = 'user_point';
    protected $pk = 'id';

    const   SXF=1;//提取扣除
    const   RECHARGE=2;//直推充值奖励
    const   PLEDGE_REWARD=3;//质押奖励
    const   CASH=4;//取出减扣
    const   CASH_BACK=5;//取出退回
    const   BUY=6;//取出退回
    const   SELL=7;//取出退回
    const   SYSTEM=99;

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type=1,$value=1){
        $data= [
            self::SXF=>__('提取扣除'),
            self::RECHARGE=>__('拓朴奖励'),
            self::PLEDGE_REWARD=>__('质押收益'),
            self::CASH=>__('提现扣除'),
            self::CASH_BACK=>__('提现退回'),
            self::BUY=>__('兑换USDT'),
            self::SELL=>__('兑换OCE'),
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
        $before=$user['point'];
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
            User::where('uid',$user_id)->setInc('point',$num);
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
