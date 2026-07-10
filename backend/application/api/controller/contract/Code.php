<?php

namespace app\api\controller\contract;

use app\admin\model\article\Slide;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use app\common\controller\Api;
use think\Cache;
use think\Config;

/**
 * 激活码
 */
class Code extends Api
{
    /**
     * 激活信息
     * @return void
     */
    public function index()
    {
        $slide = Slide::where("type",4)->where("lang",$this->request->langset())->where("status",1)
            ->field("id,thumb,url")
            ->order("displayorder desc,id desc")->limit(6)->select();
        foreach ($slide as $k=>$v){
            $slide[$k]["thumb"] = cdnurl($v['thumb'],true);
        }
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $send_total=Balance::where('user_id',$this->auth->id)->where('type',Balance::NODE_REWARD)->sum('num');
        $day=Config::get("site.node_day");
        $surplus_day=$day-$user['node_day'];
        $data = [
            "slide"=>$slide?$slide:null,
            "status"=> $user['node'],
            "price"=>Config::get("site.node_fee"),
            "day"=>$day,
            "send_total"=>$send_total,
            "surplus_day"=>$surplus_day,
            "reward"=>Config::get("site.node_num"),
        ];
        $this->success(__("节点信息"),$data);
    }
    /**
     * 创建激活
     */
    public function create()
    {
        $cache = Cache::get("code-create-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("code-create-".$this->auth->id,1,3);
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        if($user['node']==1){
            $this->error(__('请勿重复购买节点'));
        }
        $price=Config::get("site.node_fee");
        if($user['money']<$price){
            $this->error(__('USDT余额不足'));
        }
        try{
            Money::change_money($user['uid'],-1*$price,Money::BUY_LEVEL,'购买节点扣除');
            \app\admin\model\contract\User::where('uid',$user['uid'])->update(['node'=>1,'real'=>1]);
        }catch (\Exception $e){
            $this->error($e->getMessage());
        }
        $this->success(__("购买成功"));
    }
}
