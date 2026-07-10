<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/21
 * @Time: 16:43
 */
namespace app\admin\model\user;

use app\admin\model\contract\User;
use app\admin\model\pledge\Order;
use think\Config;
use think\Model as ThinkModel;
use think\Db;

class Money extends ThinkModel
{
    // 表名
    protected $name = 'user_money';
    protected $pk = 'id';

    const   PLEDGE_BUY=1;//进行质押
    const   BUY_LEVEL=2;//购买节点
    const   RECHARGE=3;//添加资金
    const   PLEDGE_BACK=4;//到期解押
    const   REWARD_GIVE=5;//奖励领取
    const   PLEDGE_REWARD=6;//质押奖励
    const   CASH=7;//提现冻结
    const   CASH_BACK=8;//取出退回
    const   BUY=10;//兑换USDT
    const   SELL=11;//兑换OCE
    const   SYSTEM=99;

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type=1,$value=1){
        $data= [
            self::PLEDGE_BUY=>__('进行质押'),
            self::BUY_LEVEL=>__('购买节点'),
            self::RECHARGE=>__('添加资金'),
            self::PLEDGE_BACK=>__('到期解押'),
            self::REWARD_GIVE=>__('奖励领取'),
            self::PLEDGE_REWARD=>__('质押奖励'),
            self::CASH=>__('提现冻结'),
            self::CASH_BACK=>__('取出退回'),
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
        $before=$user['money'];
        $after=$before+$num;
        $pledge_money=Order::where('uid',$user_id)->where('status',1)->sum('price');
        $real_user_min=Config::get('site.real_user_min');
        if($after+$pledge_money>=$real_user_min || $user['node']==1){
            User::where('uid',$user_id)->update(['real'=>1]);
        }else{
            User::where('uid',$user_id)->update(['real'=>0]);
        }
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
            User::where('uid',$user_id)->setInc('money',$num);
            if($type==self::PLEDGE_REWARD||$type==self::REWARD_GIVE){
                Point::change_money($user_id,$num,Point::PLEDGE_REWARD,'质押收益',$from);
            }
            if($type==self::RECHARGE){
                $point_rate=Config::get('site.recharge_reward');
                if($user['pid']>0&&$point_rate>0){
                    $reward=bcmul($num,$point_rate/100,6);
                    Point::change_money($user['pid'],$reward,Point::RECHARGE,'直推用户充值奖励',$from);
                }
            }
            if($type==self::BUY){
                Point::change_money($user['uid'],$num,Point::BUY,'兑换USDT',$from);
            }
            if($type==self::SELL){
                Point::change_money($user['uid'],-1*$num,Point::SELL,'兑换OCE',$from);
            }

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
