<?php

namespace app\admin\model\contract;

use think\Config;
use think\Exception;
use think\Model;


class Exchange extends Model
{





    // 表名
    protected $name = 'contract_exchange';

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
     * 开始兑换
     */
    public static function startOrder($uid,$price)
    {
        $status = Config::get("site.exchange_status");
        if($status != 1){
            throw new Exception(__("兑换未开启"));
        }
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        if($user->credit3 < $price){
            throw new Exception(__("兑换额度不足"));
        }
        $linePrice = Pool::getCzPrice();
        if($linePrice<=0){
            throw new Exception(__("代币价格获取失败"));
        }
        $money = bcdiv($price,$linePrice,6);
        if($money<=0){
            throw new Exception(__("到账金额异常"));
        }
        $model = new self();
        $model->uid = $uid;
        $model->address = $user->address;
        $model->price = $price;
        $model->linePrice = $linePrice;
        $model->money = $money;
        $model->orderId = "YC".date("YmdHis");
        $model->status = 1;
        $model->save();
        Rebate::saveRebateInfo([
            "uid"=>$uid,
            "credittype"=>"credit3",
            "types"=>"exchange",
            "price"=>-$price,
            "orderId"=>$model->id,
        ]);
        return [
            "id"=>$model->id,
            "price"=>bcmul($price,10**18,0)
        ];

    }

    /**
     * 更新 兑换状态
     */
    public static function updateOrder($info)
    {
        $order = self::where("id",$info->params1)->where("status",1)->where("price",$info->params2)->find();
        if(empty($order)){
            return false;
        }
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
    }



}
