<?php

namespace app\admin\model\contract;

use think\Config;
use think\Exception;
use think\Model;


class Pay extends Model
{





    // 表名
    protected $name = 'contract_pay';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = false;

    // 追加属性
    protected $append = [

    ];
    /**
     * 创建订单
     */
    public static function createOrder($uid,$price,$type)
    {
        $model = new self();
        $model->uid = $uid;
        $user=User::get($uid);
        if($type==1){
            $model->credittype = 'usdt';
            $contractAddress=config::get('site.contract_address');
            $to=config::get('site.recharge_address');
        }else{
            $model->credittype = 'my';
            $contractAddress=config::get('site.my_contract_address');
            $to=config::get('site.my_address_to');
        }

        $model->from=strtolower($user['address']);
        $model->to=strtolower($to);
        $model->price = $price;
        $model->status = 1;
        $model->save();

        return [
            "id"=>$model->id,
            "types"=>$model->credittype,
            "price"=>bcmul($model->price,10**18,0),
            "contractAddress"=>$contractAddress,
            "to"=>$to
        ];
    }



    /**
     * 订单充值
     */
    public static function updateOrderInfo($info)
    {
        $order = self::where("id",$info->params1)->where("price",$info->params2)->where("status",1)->find();
        if(empty($order)){
            return false;
        }
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
    }

    /**
     * 订单更新
     */
    public static function updateHashOrder($info)
    {
        $price=bcdiv($info['price'],10**18,2);
        self::where("id",$info['id'])
            ->where("price",$price)
            // ->where("credittype",$info['credittype'])
            ->where("status",1)
            ->update(['hash'=>strtolower($info['jyhash'])]);
    }


}
