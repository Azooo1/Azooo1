<?php

namespace app\api\controller\contract;

use app\admin\model\article\Slide;
use app\admin\model\pledge\Pledge as PledgeM;
use app\admin\model\pledge\Order;
use app\admin\model\pledge\OrderLog;
use app\common\controller\Api;
use app\common\controller\Price;
use think\Cache;
use think\Config;
use think\Db;

/**
 * 抢购玩法
 */
class Pledge extends Api
{
    /**
     * 基础信息
     */
    public function index()
    {
        $data = [
            "pledge_min"=>Config::get("site.pledge_min"),
            "pledge_mul"=>Config::get("site.pledge_mul"),
            "pledge_rate"=>Config::get("site.pledge_rate"),
            "pledge_usdt"=>Config::get("site.pledge_usdt"),
            "pledge_oce"=>100-Config::get("site.pledge_usdt"),
            "pledge_max"=>Config::get("site.pledge_max"),
            "pledge_title"=>Config::get("site.pledge_title"),
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
        $num = $this->request->post("num");
        $cache = Cache::get("queue-createqid-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("queue-createqid-".$this->auth->id,1,3);
        Db::startTrans();
        try{
            $data = Order::createOrderAdmin($this->auth->id,$num);
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("质押成功"),$data);
    }


    /**
     * 订单记录
     */
    public function getList()
    {
        $query = Order::where("uid",$this->auth->id);
        $list = $query->order("id desc")
            ->paginate();
        $status=[
            1=>__('质押中'),
            2=>__('待解押'),
            3=>__('已解押')
        ];
        foreach ($list as $k =>$v){
            $list[$k]['status_text']=$status[$v['status']];
        }
        $data = [
            "list"=>$list?$list:[]
        ];
        $this->success(__("订单记录"),$data);
    }
}
