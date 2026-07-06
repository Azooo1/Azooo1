<?php

namespace app\admin\model\contract;

use app\admin\model\user\Relation;
use app\common\library\Eth;
use Exception;
use think\Cache;
use think\Config;
use think\Model;


class User extends Model
{





    // 表名
    protected $name = 'contract_user';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = false;

    // 追加属性
    protected $append = [
        'direct_valid_count',
        'team_valid_count',
    ];
    public function getOriginData()
    {
        return $this->origin;
    }

    /**
     * 直推有效人数
     */
    public function getDirectValidCountAttr($value, $data)
    {
        if (empty($data['uid'])) {
            return 0;
        }
        return self::where('pid', $data['uid'])->where('real', 1)->count();
    }

    /**
     * 团队有效人数
     */
    public function getTeamValidCountAttr($value, $data)
    {
        if (empty($data['uid'])) {
            return 0;
        }
        return self::where("FIND_IN_SET(" . $data['uid'] . ",team)")->where('real', 1)->count();
    }
    protected static function init()
    {
        self::beforeUpdate(function ($row) {
            $changed = $row->getChangedData();
        });
    }


    /**
     * 会员同步
     */
    public static function addUserInfo($user)
    {
        $model = new self();
        $model->uid = $user->id;
        $model->address = $user->address ?: ($user->evm_address ?: ('u' . $user->id));
        $model->status = 1;
        $model->save();
    }
    /**
     * 获取用户信息
     */
    public static function getUserInfo($uid,$types = "uid"){
        if($types == "address"){
            return self::where("address",$uid)->find();
        }else{
            return self::where("uid",$uid)->find();
        }
    }
    /**
     * 绑定上级
     */
    public static function bindAddressInfo($uid,$address){
        $user = User::getUserInfo($uid);
        if(empty($user) || $user->pid>0){
            throw new Exception(__("用户当前无法绑定到上级"));
        }
        $downUser = User::where("pid",$uid)->find();
        if(!empty($downUser)){
            throw new Exception(__("已绑定下级，无法绑定上级"));
        }
        $upInfo = User::where("address",$address)->find();
        if(empty($upInfo)){
            throw new Exception(__("获取上级信息失败"));
        }
        $userAddress = Config::get("site.one_address");
        $isOne = false;
        foreach ($userAddress as $ks=>$vs){
            if(strtolower($vs) == strtolower($address)){
                $isOne = true;
                if(strtolower($user->address) == strtolower($vs)){
                    throw new \think\Exception("当前账户无法绑定");
                }
            }
        }
        if ($isOne == false && $upInfo->pid <= 0) {
            throw new Exception(__("上级未绑定邀请码,无法绑定"));
        }
        $relation = $upInfo->uid."-".$upInfo["relation"];
        $team=empty($upInfo->team)?$upInfo->uid:$upInfo->team.','.$upInfo->uid;
        $parent_id=$upInfo->uid;
        $line=$upInfo->line+1;
        User::update([
            "relation"=>$relation,
            'team'=>$team,
            'pid'=>$parent_id,
            'line'=>$line
        ],
            ["uid"=>$uid]
        );
        Relation::saveRelation($user->id,$relation);
    }


    /**
     * 节点转让
     */
    public static function nodeTransfer($uid,$address,$nums)
    {
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new \think\Exception(__("用户信息异常"));
        }
        if($user->node < $nums || $nums<=0){
            throw new \think\Exception(__("节点数量异常"));
        }
        $toUser = User::getUserInfo($address,"address");
        if(empty($toUser) || $toUser->uid == $uid){
            throw new \think\Exception(__("地址信息异常"));
        }
        $orderId = "transfer".$uid.$toUser->uid;
        Rebate::saveRebateInfo([
            "uid"=>$uid,
            "credittype"=>"node",
            "types"=>"transfer",
            "price"=>-$nums,
            "orderId"=>$orderId
        ]);
        Rebate::saveRebateInfo([
            "uid"=>$toUser->uid,
            "credittype"=>"node",
            "types"=>"transfer",
            "price"=>$nums,
            "orderId"=>$orderId
        ]);
    }
    /**
     * 监听lp 变动
     */
    public static function crontabLp()
    {
        $daytime = strtotime(date("Y-m-d"));
        $list = self::where("lptime","<",$daytime)->order("id asc")->limit(50)->select();
        if(empty($list)){
            return false;
        }
        $eth = new Eth();
        $lpAddress = Config::get("site.lp_address");
        if(empty($lpAddress)){
            return false;
        }
        if(date("s")<5){
            sleep(5-date("s"));
        }
        foreach ($list as $ks=>$vs){
            if(date("s")>=57){
                break;
            }
            $cache = Cache::get("address-lp-".$vs->id);
            if(!empty($cache)){
                continue;
            }
            Cache::set("address-lp-".$vs->id,1,30);
            $timeCache = Cache::get("address-lptime-".date("s"));
            if(!empty($timeCache) && $timeCache>=3){
                sleep(1);
                continue;
            }
            Cache::set("address-lptime-".date("s"),$timeCache+1,10);
            $lpNum = $eth->getBalance($lpAddress,$vs->address);
            $lpPrice = bcdiv($lpNum,10**18,6);
            $vs->credit6 = $lpPrice;
            $vs->lptime = time();
            $vs->save();
        }
        return true;
    }
    /**
     * 预约功能设置
     */
    public static function startBook($uid)
    {
        $user = self::getUserInfo($uid);
        if(empty($user)){
            throw new \think\Exception(__("用户信息获取失败"));
        }
        $user->bookStatus = $user->bookStatus == 1?0:1;
        $user->save();
    }
}
