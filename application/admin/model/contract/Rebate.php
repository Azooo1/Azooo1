<?php

namespace app\admin\model\contract;

use Exception;
use think\Model;


class Rebate extends Model
{





    // 表名
    protected $name = 'contract_rebate';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = false;

    // 追加属性
    protected $append = [

    ];
    public static function getCredittype()
    {
        return [
            "credit1" => "账户1",
            "credit2"=>"账户2",
            "credit3"=>"账户3",
        ];
    }
    public static function getTypes($lang = "zh-cn"){
        if($lang == "en"){
            return [
                "admin"=>"manage",
                "transfer"=>"transfer",
                "withdraw"=>"withdraw",
                "recharge"=>"recharge",
                "paynode"=>"paynode",
                "paycode"=>"paycode",
                "superCodePool"=>"superCodePool",
                "codePool"=>"codePool",
                "cakePool"=>"cakePool",
                "exchange"=>"exchange",
                "payment"=>"payment",
                "static"=>"static",
                "out"=>"out",
                "userAddLp"=>"userAddLp",
                "czNodePool"=>"czNodePool",
                "czZjPool"=>"czZjPool",
                "czBxPool"=>"czBxPool",
                "czLpPool"=>"czLpPool",
                "recommend"=>"recommend",
                "bcGive"=>"bcGive",
                "cancellp"=>"cancellp"
            ];
        }else{
            return [
                "admin"=>"管理",
                "transfer"=>"转让",
                "withdraw"=>"提现",
                "recharge"=>"充值",
                "paynode"=>"节点",
                "paycode"=>"激活",
                "superCodePool"=>"超级节点分红",
                "codePool"=>"节点分红",
                "cakePool"=>"门票分红",
                "exchange"=>"兑换",
                "payment"=>"支付",
                "static"=>"静态收益",
                "out"=>"出局收益",
                "userAddLp"=>"用户添加LP",
                "czNodePool"=>"节点池分红",
                "czZjPool"=>"中奖池分红",
                "czBxPool"=>"保险池分红",
                "czLpPool"=>"lp分红",
                "recommend"=>"推荐",
                "bcGive"=>"爆仓额度",
                "cancellp"=>"撤销lp"
            ];
        }

    }

    /**
     * 返佣记录
     */
    public static function saveRebateInfo($data)
    {
        $rebate = [
            "uid"=>$data['uid'],
            "types"=>$data['types'],
            "date"=>date("Y-m-d"),
            "price"=>$data['price'],
            "orderId"=>$data['orderId'],
            "credittype"=>$data['credittype'],
            "percent"=>isset($data["percent"])?$data["percent"]:100,
            "status"=>1,
            "createtime"=>time(),
            "updatetime"=>time(),
        ];
        $user = User::where('uid',$data['uid'])->find();
        if(empty($user)){
            throw new Exception("会员信息异常");
        }
        $rebate["address"] = $user->address;
        $newId = self::insert($rebate,false,1);
        if(abs($rebate['price'])<=0) {
            return true;
        }
        $credittype = $rebate['credittype'];
        $after = bcadd($user->$credittype , $data['price'],6);
        if ($after<0 || $newId <=0) {
            throw new Exception($data['uid']."账户类型为:".$credittype."的操作异常");
        }
        $ago = $user->$credittype;
        //更新会员信息
        $re = User::where('uid',$data['uid'])->where('lock_version',$user['lock_version'])->update([
            "lock_version" =>$user['lock_version']+1,
            $credittype=>$after,
        ]);
        if($re == false){
            throw new Exception("账户类型为:".$credittype."的账户信息更新失敗");
        }
        self::where('id',$newId)->update([
            "after"=>$after,
            "ago"=>$ago,
        ]);
        return true;
    }







}
