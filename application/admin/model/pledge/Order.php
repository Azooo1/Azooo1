<?php

namespace app\admin\model\pledge;


use app\admin\model\contract\Level;
use app\admin\model\contract\User;
use app\admin\model\user\Amount;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use app\admin\model\user\Point;
use app\common\controller\Price;
use think\Config;
use think\Db;
use think\Exception;
use think\Model;


class Order extends Model
{





    // 表名
    protected $name = 'pledge_order';


    // 追加属性
    protected $append = [
    ];

    /**
     * 购买协议
     * @param $user_id 用户ID
     * @param $cover_id 产品ID
     * @param $num 锁仓数量
     * @return void
     */
    public static function createOrderAdmin($user_id,$num){
        // 质押时间段校验
        $pledgeStartTime = Config::get('site.pledge_start_time');
        $pledgeEndTime = Config::get('site.pledge_end_time');
        if (!empty($pledgeStartTime) && !empty($pledgeEndTime)) {
            $currentTime = date('H:i');
            if ($currentTime < $pledgeStartTime || $currentTime >= $pledgeEndTime) {
                throw new Exception(__('质押时间为每日') . $pledgeStartTime . '-' . $pledgeEndTime);
            }
        }

        $user=User::where('uid',$user_id)->find();
        $pledge_min=Config::get('site.pledge_min');
        $pledge_mul=Config::get('site.pledge_mul');
        $pledge_max=Config::get('site.pledge_max');
        if($user['money']>=$pledge_max&&$pledge_max>0){
            $num=$pledge_max;
        }else{
            $bei=floor($user['money']/$pledge_mul);
            $num=$bei*$pledge_mul;
        }
        if($user['money']<$num){
            throw new Exception(__("USDT余额不足"));
        }
        if($pledge_min>$num){
            throw new Exception(__('质押数量不能低于').$pledge_min.'USDT');
        }
        if($num%$pledge_mul!=0){
            throw new Exception(__('质押数量请填写').$pledge_mul.__('倍数'));
        }
        if(self::where('uid',$user_id)->whereTime('create_time','today')->find()){
            throw new Exception('每日只能质押一次');
        }


        //所有条件满足，开始生成订单信息
        $order_sn=self::CreateOrderSn();
        $send_time=strtotime(date('Y-m-d'))+86400;
        $order=[
            'ordersn'=>$order_sn,
            'uid'=>$user_id,
            'price'=>$num,
            'create_time'=>time(),
            'pay_time'=>time(),
            'send_time'=>time()+30,
//            'send_time'=>$send_time,
            'status'=>1
        ];
//        $max_level=Level::where('price','gt',0)->where('price','elt',$num)->max('id');
        //开始处理
        Db::startTrans();
        try {
            //插入记录
            self::insert($order);

            if($num>0){
                Money::change_money($user_id,-1*$num,Money::PLEDGE_BUY,'质押支付',$order_sn);
            }
            // 提交事务
            Db::commit();
            $result=true;
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            $result=false;
        }
        if(!$result){
            throw new Exception(__('质押失败，请刷新重试').$e);
        }
    }

    /**
     * 生成订单号
     */
    static public function CreateOrderSn(){
        $i=1;
        while ($i==1){
            $orderSn = 'ZY_'.strtoupper(dechex(date('m'))) . date('d') . substr(time(), -5) . substr(microtime(), 2, 5) . sprintf('%02d', rand(0, 99));
            if(!self::where('ordersn',$orderSn)->find()){
                $i++;
            }
        }
        return $orderSn;
    }
}
