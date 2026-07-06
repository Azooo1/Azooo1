<?php

namespace app\admin\model\contract;

use think\Config;
use think\Exception;
use think\Model;


class Queue extends Model
{





    // 表名
    protected $name = 'contract_queue';

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
     * 基础排队信息
     */
    public static function getInfo()
    {
        $status = Config::get("site.queue_status");
        if(empty($status)){
            return false;
        }
        $info = self::where("status",1)->order("id desc")->find();
        if(!empty($info)){
            return $info;
        }
        $model = new self();
        $round = self::max("round");
        $model->round = bcadd($round,1,0);
        $model->pindex = 1;
        $model->size = 1;
        $model->nums = 0;
        $starttime = time();
        $model->starttime = $starttime;
        $model->halftime = bcadd($starttime,Config::get("site.queue_hour_reset")*3600,0);
        $model->endtime = bcadd($starttime,Config::get("site.queue_hour_reset")*3600 + Config::get("site.queue_pay_hour")*3600,0);
        $model->status = 1;
        $model->save();
        return $model;
    }
    /**
     * 自己购买次数
     */
    public static function getPayInfo($queueInfo,$uid)
    {
        //自己购买次数限制
        $payStatus = 1;
        $limittime = 0;
        if(!empty($queueInfo)) {
            $payNum = Config::get("site.queue_pay_num");
            if ($payNum > 0) {
                $hour = Config::get("site.queue_pay_time");
                $time24 = time() - $hour * 3600;
                $payCount = Order::where("round", $queueInfo->round)->where("uid", $uid)->where("createtime", ">", $time24)->count();
                if ($payCount >= $payNum) {
                    $payStatus = 0;
                    $payInfo = Order::where("round", $queueInfo->round)->where("uid", $uid)->where("createtime", ">", $time24)->order("id asc")->find();
                    $limittime = bcsub($payInfo->createtime, $time24, 0);
                }
            }
            $userInfo = User::getUserInfo($uid);
            //购买间隔
            if ($userInfo->node > 0) {
                $space = Config::get("site.queue_pay_space_node");
            } else {
                $space = Config::get("site.queue_pay_space");
            }
            $payInfo = Order::where("round", $queueInfo->round)->where("uid", $uid)->order("id desc")->find();
            if (!empty($payInfo) && $payInfo->createtime + $space * 3600 > time() && $payStatus == 1) {
                $payStatus = 0;
                $limittime = bcsub($payInfo->createtime + $space * 3600, time(), 0);
            }
            if ($limittime == 0 && $payStatus == 0) {
                $payStatus = 1;
            }
        }
        return [
            "payStatus"=>$payStatus,
            "limittime"=>$limittime,
        ];
    }
}
