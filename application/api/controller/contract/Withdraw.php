<?php

namespace app\api\controller\contract;


use app\common\controller\Api;
use think\Cache;
use think\Db;

/**
 * 提现信息
 */
class Withdraw extends Api
{
    /**
     * 基础信息
     */
    public function index()
    {
        $cache = Cache::get("user-withdraw-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("user-withdraw-".$this->auth->id,1,10);
        $price = $this->request->post("price",0);
        if($price<=0){
            $this->error("金额异常");
        }
        $credittype = $this->request->post("credittype");
        Db::startTrans();
        try{
            $data = \app\admin\model\contract\Withdraw::applyforWithdraw($this->auth->id,$price,$credittype);
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("提现申请"),$data);
    }

    /**
     * 提现记录
     */
    public function getList()
    {
        $credittype = $this->request->post("credittype");
        $list = \app\admin\model\contract\Withdraw::where("uid",$this->auth->id)
            ->where('credittype',$credittype)
            ->field("id,price,createtime,status,remark,money,service")
            ->order("id desc")
            ->paginate();
        $data = [
            "list"=>$list?$list:[],
            "typesInfo"=>[]
        ];
        $this->success(__("提现记录"),$data);
    }
    /**
     * 提现领取
     */
    public function getClaim()
    {
        $id = $this->request->post("id");
        if($id<=0){
            $this->error(__("参数异常"));
        }
        try{
            $data = \app\admin\model\contract\Withdraw::getClaimInfo($this->auth->id,$id);
        }catch (\Exception $e){
            $this->error($e->getMessage());
        }
        $this->success(__("提现参数"),$data);
    }
}
