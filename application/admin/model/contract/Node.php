<?php

namespace app\admin\model\contract;

use GuzzleHttp\Pool;
use think\Config;
use think\Exception;
use think\Model;


class Node extends Model
{





    // 表名
    protected $name = 'contract_node';

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
     * 节点购买
     */
    public static function createOrder($uid)
    {
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        $price = Config::get("site.node_price");
        if($price<=0){
            throw new Exception(__("金额异常"));
        }
        $model = new self();
        $model->uid = $uid;
        $model->address = $user->address;
        $model->price = $price;
        $model->status = 1;
        $model->save();
        return [
            "id"=>$model->id,
            "price"=>$model->price,
        ];
    }



    /**
     * 更新订单信息
     */
    public static function updateUserNode($info)
    {
        $order = self::where("id",$info->params1)->where("price",$info->params2)->where("status",1)->find();
        if(empty($order)){
            return false;
        }
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
        Rebate::saveRebateInfo([
            "uid"=>$order->uid,
            "credittype"=>"node",
            "types"=>"paynode",
            "price"=>1,
            "orderId"=>$order->id,
        ]);
    }


}
