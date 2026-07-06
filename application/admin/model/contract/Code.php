<?php

namespace app\admin\model\contract;

use think\Config;
use think\Exception;
use think\Model;


class Code extends Model
{





    // 表名
    protected $name = 'contract_code';

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
    public static function createOrder($uid)
    {
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        if($user->node > 0){
            throw new Exception(__("已是节点，无需激活"));
        }
        $status = Config::get("site.code_status");
        if($status != 1){
            throw new Exception(__("激活未开启"));
        }
        $price = Config::get("site.code_price");
        if($price<=0){
            throw new Exception(__("激活金额异常"));
        }
        $day = Config::get("site.code_day");
        if($day<=0){
            throw new Exception(__("激活时效异常"));
        }
        $model = self::where("uid",$uid)->where("status",1)->order("id desc")->find();
        if(empty($model)){
            $model = new self();
            $model->uid = $uid;
            $model->address = $user->address;
        }
        $model->price = $price;
        $model->endtime = time() + $day*86400;
        $model->status = 1;
        $model->save();
        return [
            "id"=>$model->id,
            "price"=>bcmul($model->price,10**18,0)
        ];
    }
    /**
     * 更新支付结果
     */
    public static function updateOrderInfo($info)
    {
        $order = self::where("id",$info->params1)->where("price",$info->params2)->where("status",1)->find();
        if(empty($order)){
            return false;
        }
        $day = Config::get("site.code_day");
        $codeInfo = self::where("uid",$order->uid)->where("status",2)->where("endtime",">",time())->order("id desc")->find();
        if(!empty($codeInfo)){
            $order->endtime = $day*86400 + $codeInfo->endtime;
        }else{
            $order->endtime = $day*86400 + time();
        }
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
    }
}
