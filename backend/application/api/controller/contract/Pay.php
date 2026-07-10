<?php

namespace app\api\controller\contract;

use app\admin\model\contract\Exchange;
use app\admin\model\contract\Lp;
use app\admin\model\contract\Pool;
use app\admin\model\contract\Rebate;
use app\admin\model\user\Amount;
use app\admin\model\user\Balance;
use app\admin\model\user\Direct;
use app\admin\model\user\Money;
use app\admin\model\user\Point;
use app\common\controller\Api;
use think\Cache;
use think\Config;
use think\Db;

/**
 * 充值
 */
class Pay extends Api
{
    /**
     * 充值信息
     */
    public function index()
    {
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $balance=0;
        $coin_price=Config::get('site.coin_price');
        if($user->balance>0){
            $balance=bcmul($user->balance,$coin_price,6);
        }
        $total=bcadd($user->money,$balance,6);
        $data = [
            "money"=>$user->money,
            "balance"=>$user->balance,
            "soce"=>$user->soce,
            "point"=>$user->point,
            "amount"=>$user->amount,
            "info"=>htmlspecialchars_decode(Config::get("site.pay_info_".$this->request->langset())),
            "withdrawStatus"=>Config::get("site.withdraw_status"),
            "usdtCashSxf"=>Config::get("site.usdt_cash_sxf"),
            "myCashSxf"=>Config::get("site.my_cash_sxf"),
            "recharge_min"=>Config::get("site.recharge_min"),
            "czPrice"=>Pool::getCzPrice(),
            "user"=>[
                "money"=>$user->money,
                "balance"=>$user->balance,
                "soce"=>$user->soce,
                "point"=>$user->point,
                "amount"=>$user->amount,
                "direct"=>$user->direct,
                "total"=>$total,
                "address"=>$user->address,
                "node"=>$user->node
            ],
            "usdtCash"=>[
                'money'=>$user->money,
                'balance'=>$user->balance,
                "soce"=>$user->soce,
                "point"=>$user->point,
                "amount"=>$user->amount,
                "direct"=>$user->direct,
                "withdraw_status"=>Config::get('site.withdraw_status'),
                "withdraw_min"=>Config::get('site.withdraw_min'),
                "cash_sxf_usdt"=>Config::get('site.cash_sxf_usdt'),
                "cash_sxf_oce"=>Config::get('site.cash_sxf_oce'),
                "cash_sxf_point"=>Config::get('site.cash_sxf_point'),
                "cash_sxf_direct"=>Config::get('site.cash_sxf_direct'),
                "cash_sxf_usdt_num"=>Config::get('site.cash_sxf_usdt_num'),
                "cash_week"=>Config::get('site.cash_week'),
                "cash_start_time"=>Config::get('site.cash_start_time'),
                "cash_end_time"=>Config::get('site.cash_end_time'),
            ]
        ];
        $this->success(__("基础信息"),$data);
    }
    /**
     * 充值
     */
    public function create()
    {
        $cache = Cache::get("wallet-recharge-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("wallet-recharge-".$this->auth->id,1,3);

        $price = $this->request->post("price",0);
        $type = $this->request->post("type",1);
        if($price<=0){
            $this->error(__("金额异常"));
        }
        $min=Config::get("site.recharge_min");
        if($price<$min){
            $this->error(__("数量不能小于"). $min.' USDT');
        }
        try{
            $data = \app\admin\model\contract\Pay::createOrder($this->auth->id,$price,$type);
        }catch (\Exception $e){
            $this->error($e->getMessage());
        }
        $this->success(__("创建成功"),$data);
    }
    /**
     * 充值
     */
    public function updateRecharge()
    {
        $cache = Cache::get("wallet-updateRecharge-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("wallet-updateRecharge-".$this->auth->id,1,3);
        $types = $this->request->post("types","usdt");
        if(empty($types)){
            $this->error(__("账户异常"));
        }
        if($types=='usdt'){
            $credittype='usdt';
            $to=Config::get("site.contract_address");
        }else{
            $credittype='my';
            $to=Config::get("site.my_contract_address");
        }
        $price = $this->request->post("price",0);
        $jyhash = $this->request->post("jyhash",0);
        $id = $this->request->post("id",0);
        $user = \app\admin\model\contract\User::where("uid",$this->auth->id)->find();
        try{
            \app\admin\model\contract\Pay::updateHashOrder(['id'=>$id,'jyhash'=>$jyhash,'price'=>$price,'credittype'=>$credittype,'from'=>$user['address'],'to'=>$to]);
        }catch (\Exception $e){

            $this->error($e->getMessage());
        }
        $this->success(__("Success"));
    }
    /**
     * 账户记录
     */
    public function getRebateList()
    {
        $credittype = $this->request->post("credittype","1");
        if($credittype==1){
            $list = Money::where("user_id",$this->auth->id)
                ->order("id desc")
                ->field("id,num,type,create_time")
                ->paginate();
            $typelist=Money::getTypeList();
        }elseif($credittype==2){
            $list = Balance::where("user_id",$this->auth->id)
                ->order("id desc")
                ->field("id,num,type,create_time")
                ->paginate();
            $typelist=Balance::getTypeList();
        }elseif($credittype==3){
            $list = Point::where("user_id",$this->auth->id)
                ->order("id desc")
                ->field("id,num,type,create_time")
                ->paginate();
            $typelist=Point::getTypeList();
        }elseif($credittype==4){
            $list = Amount::where("user_id",$this->auth->id)
                ->order("id desc")
                ->field("id,num,type,create_time")
                ->paginate();
            $typelist=Amount::getTypeList();
        }elseif($credittype==5){
            $list = Direct::where("user_id",$this->auth->id)
                ->order("id desc")
                ->field("id,num,type,create_time")
                ->paginate();
            $typelist=Direct::getTypeList();
        }
        $data = [
            "list"=>$list?$list:[],
            "typesInfo"=>$typelist
        ];
        $this->success(__("返佣记录"),$data);
    }

    /**
     * 撤销记录
     */
    public function getCancelLpList()
    {
        $credittype = $this->request->post("credittype");
        if($credittype==1){
            $type='usdt';
        }else{
            $type='my';
        }
        $list = \app\admin\model\contract\Pay::where("uid",$this->auth->id)->where("credittype",$type)
            ->order("id desc")
            ->paginate();
        $data = [
            "list"=>$list?$list:null,
        ];
        $this->success(__("充值记录"),$data);
    }
}
