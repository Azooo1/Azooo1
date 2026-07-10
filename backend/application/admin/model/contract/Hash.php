<?php

namespace app\admin\model\contract;

use think\Db;
use think\Model;


class Hash extends Model
{





    // 表名
    protected $name = 'contract_hash';

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
     * hash 记录
     */
    public static function addInfo($data)
    {
        $model = new self();
        $model->types = $data["types"];
        $model->hash = $data["hash"];
        $model->block = $data["block"];
        $model->logIndex = $data["logIndex"];
        $model->info = json_encode($data["info"],true);
        $model->status = 1;
        $model->createtime = $data["time"];
        $address = self::getAddress($data["info"][1]);
        $model->address = $address;
        if(!empty($data["info"][2])){
            $price1 = hexdec($data["info"][2]);
            $model->params1 = $price1;
        }
        if(!empty($data["info"][3])) {
            $price2 = self::getPrice($data["info"][3]);
            $model->params2 = $price2;
        }
        $model->save();
    }

    /**
     * 获取用户地址
     */
    public static function getAddress($address){

        return substr_replace($address,"",2,24);
    }

    /**
     * 获取金额
     */
    public static function getPrice($price,$double = 6){
        $price = strtolower(hexdec($price));
        if(strpos($price,"e") === false){
            return bcdiv($price,1000000000000000000,$double);
        }
        $a = explode("e",strtolower($price));
        return bcdiv(bcmul($a[0], bcpow(10, $a[1])),1000000000000000000,$double);
    }




    /**
     * 定时处理hash
     */
    public static function crontab()
    {
        $list = self::where("status",1)->order("id asc")->limit(100)->select();
        if(empty($list)){
            return false;
        }
        foreach ($list as $ks=>$vs){
            Db::startTrans();
            try{
                $vs->status = 2;
                $vs->save();
                if($vs->types == "paynode"){
                    Node::updateUserNode($vs);
                }elseif($vs->types == "paycode"){
                    Code::updateOrderInfo($vs);
                }elseif($vs->types == "lpinfo") {
                    if ($vs->params1 == 1) {
                        Pool::addPoolInfo(21, $vs->params2, $vs->id);
                    } else {
                        Pool::addPoolInfo(22, $vs->params2, $vs->id);
                    }
                }elseif($vs->types == "rechargeinfo"){
                    Pay::updateOrderInfo($vs);
                }elseif($vs->types == "exchangeinfo"){
                    $poolInfo = Pool::where("id",$vs->params1)->find();
                    Pool::addPoolInfo(23,$vs->params2,$poolInfo->outId);
                    Pool::updateQueueInfo($poolInfo->outId,23);
                }elseif($vs->types == "winninginfo"){
                    $poolInfo = Pool::where("id",$vs->params1)->find();
                    Pool::addPoolInfo(24,$vs->params2,$poolInfo->outId);
                    Pool::updateQueueInfo($poolInfo->outId,24);
                }elseif($vs->types == "exchangecakeinfo"){
                    $poolInfo = Pool::where("id",$vs->params1)->find();
                    Pool::addPoolInfo(13,$vs->params2,$poolInfo->outId);
                    Pool::updateQueueInfo($poolInfo->outId,13);
                }elseif($vs->types == "UserAddLp"){
                    Lp::updateOrder($vs);
                }elseif($vs->types == "withdraw"){
                    Withdraw::updateOrder($vs);
                }elseif($vs->types == "exchangeczinfo"){
                    //兑换记录更新状态
                    Exchange::updateOrder($vs);
                }elseif($vs->types == "UserCancelLp"){
                    //撤lp
                    Lp::cancelUpdateOrder($vs);
                }
                Db::commit();
            }catch (\Exception $e){
                Db::rollback();
                var_dump($e->getMessage());
            }
        }
        return true;
    }

    /**
     * 更新用户节点
     */
    public static function updateUserNode($vs)
    {
        $user = User::getUserInfo($vs->address,"address");
        if(empty($user)){
            return false;
        }
        Rebate::saveRebateInfo([
            "uid"=>$user->uid,
            "credittype"=>"node",
            "types"=>"paynode",
            "price"=>1,
            "orderId"=>$vs->id,
        ]);
    }
}
