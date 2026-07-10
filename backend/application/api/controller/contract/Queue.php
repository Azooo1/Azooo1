<?php

namespace app\api\controller\contract;

use app\admin\model\article\Slide;
use app\admin\model\contract\Lp;
use app\admin\model\contract\Order;
use app\admin\model\contract\Pool;
use app\common\controller\Api;
use think\Cache;
use think\Config;
use think\Db;

/**
 * 抢购玩法
 */
class Queue extends Api
{
    /**
     * 基础信息
     */
    public function index()
    {
        $slide = Slide::where("type",4)->where("lang",$this->request->langset())->where("status",1)
            ->field("id,thumb,url")
            ->order("displayorder desc,id desc")->limit(6)->select();
        foreach ($slide as $k=>$v){
            $slide[$k]["thumb"] = cdnurl($v['thumb'],true);
        }
        //排队信息
        $queueInfo = \app\admin\model\contract\Queue::getInfo();
        //自己购买倒计时
        $userPayInfo = \app\admin\model\contract\Queue::getPayInfo($queueInfo,$this->auth->id);
        $reset = Config::get("site.queue_hour_reset");
        if(empty($queueInfo) || $queueInfo->endtime - time() > $reset * 3600){
            $limittime = 0;
        }else{
            $limittime = $queueInfo->endtime - time()>0?bcsub($queueInfo->endtime, time(),0):0;
        }
        //会员信息
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $data = [
            "slide"=>$slide?$slide:null,
            "queueInfo"=>[
                "qid"=>$queueInfo?$queueInfo["id"]:0,
                "limittime"=>$limittime,
                "round"=>$queueInfo?$queueInfo["round"]:0,
                "price"=>bcadd(Order::getIndexPrice(3),Config::get("site.queue_service"),2)
            ],
            "userPyaInfo"=>$userPayInfo,
            "bookStatus"=>$user["bookStatus"]
        ];

        $this->success(__("基础信息"),$data);
    }
    /**
     * 购买
     */
    public function create()
    {
        $cache = Cache::get("queue-create-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("queue-create-".$this->auth->id,1,3);
        $qid = $this->request->post("qid");
        if($qid<=0){
            $this->error(__("轮数信息获取失败"));
        }
        $cache = Cache::get("queue-createqid-".$qid);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("queue-createqid-".$qid,1,1);
        Db::startTrans();
        try{
            $data = Order::createOrder($this->auth->id,$qid);
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("抢购成功"),$data);
    }
    /**
     * 订单记录
     */
    public function getList()
    {
        $status = $this->request->post("status");
        $query = Order::where("uid",$this->auth->id);
        if(!empty($status)){
            $query->where("status",$status);
        }
        $list = $query->order("id desc")
            ->field("id,price,service,status,createtime,endtime,outStatus,pindex")
            ->paginate();
        foreach ($list as $ks=>$vs){
            $list[$ks]["limittime"] = 0;
            if($vs["status"] == 2 && $vs["endtime"]> time()){
                $list[$ks]["limittime"] = bcsub($vs["endtime"],time(),0);
                $list[$ks]["status"] = 1;
            }
            $list[$ks]["profit"] = bcadd($vs["price"]+$vs["service"],Order::getIndexPrice($vs["pindex"],2));
            $list[$ks]["lpInfo"] = null;
            if($vs["status"] == 2 && $vs["outStatus"] == 1){
                $list[$ks]["lpInfo"] = Lp::where("uid",$this->auth->id)->where("types",1)->where("orderId",$vs["id"])
                    ->field("id,price,lp,status")
                    ->find();
            }
        }
        $data = [
            "list"=>$list?$list:[],
            "statusInfo"=>Order::getStatusInfo($this->request->langset()),
        ];
        $this->success(__("订单记录"),$data);
    }
    /**
     * 开启预约
     */
    public function startBook()
    {
        try{
            \app\admin\model\contract\User::startBook($this->auth->id);
        }catch (\Exception $e){
            $this->error($e->getMessage());
        }
        $this->success(__("操作成功"));
    }
}
