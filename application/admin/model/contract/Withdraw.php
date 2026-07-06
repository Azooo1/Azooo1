<?php

namespace app\admin\model\contract;

use app\admin\model\user\Amount;
use app\admin\model\user\Balance;
use app\admin\model\user\Direct;
use app\admin\model\user\Money;
use app\admin\model\user\Point;
use app\common\library\Aes;
use Elliptic\EC;
use think\Config;
use think\Exception;
use think\Model;
use Web3\Contracts\Ethabi;
use Web3\Contracts\Types\Address;
use Web3\Contracts\Types\Bytes;
use Web3\Contracts\Types\Str;
use Web3\Contracts\Types\Uinteger;
use Web3\Utils;


class Withdraw extends Model
{





    // 表名
    protected $name = 'contract_withdraw';

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
     * 状态
     */
    public static function getStatusInfo($lang)
    {
        if($lang == "en"){
            return [
                1=>"Pending approval",
                2=>"unclaimed",
                3=>"Already received",
                9=>"REJECTED"
            ];
        }else{
            return [
                1=>"待审核",
                2=>"待领取",
                3=>"已到账",
                9=>"已拒绝"
            ];
        }
    }

    /**
     * 申请提现
     */
    public static function applyforWithdraw($uid,$price,$credittype)
    {
        $status = Config::get("site.withdraw_status");
        if($status != 1){
            throw new Exception(__("提现未开启"));
        }

        // 提现日期校验（cash_week: 1=周一 ... 7=周日）
        $cashWeek = Config::get('site.cash_week');
        if (!empty($cashWeek)) {
            $currentDayOfWeek = date('N'); // 1=Monday ... 7=Sunday
            $allowedDays = is_array($cashWeek) ? $cashWeek : explode(',', $cashWeek);
            if (!in_array($currentDayOfWeek, $allowedDays)) {
                throw new Exception(__("当前日期不在提现开放日内"));
            }
        }

        // 提现时间段校验
        $cashStartTime = Config::get('site.cash_start_time');
        $cashEndTime = Config::get('site.cash_end_time');
        if (!empty($cashStartTime) && !empty($cashEndTime)) {
            $currentTime = date('H:i');
            if ($currentTime < $cashStartTime || $currentTime >= $cashEndTime) {
                throw new Exception(__('提现时间为') . $cashStartTime . '-' . $cashEndTime);
            }
        }

        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        if($user->money < $price || $price<=0){
            throw new Exception(__("USDT余额不足"));
        }
        $userMoneyMin = Config::get('site.user_money_min');
        if($userMoneyMin > 0 && bcsub($user->money, $price, 6) < $userMoneyMin){
            throw new Exception(__("提现后余额不能少于") . $userMoneyMin);
        }
        $min=Config::get('site.withdraw_min');
        $cash_sxf_usdt=Config::get('site.cash_sxf_usdt');
        $cash_sxf_oce=Config::get('site.cash_sxf_oce');
        $cash_sxf_point=Config::get('site.cash_sxf_point');
        $cash_sxf_direct=Config::get('site.cash_sxf_direct');
        $coin_price=Config::get('site.coin_price');
        $cash_sxf_usdt_num=Config::get('site.cash_sxf_usdt_num');
        $usdt_sxf=0;
        $oce_sxf=0;
        $point_sxf=0;
        $direct_sxf=0;
        $usdt_num_sxf=0;
        if($price<$min){
            throw new Exception(__("提现数量不能少于").$min);
        }
        if($price%100!=0){
            throw new Exception(__("提现数量请填写100的倍数"));
        }
        if(self::where('uid',$user->uid)->where('status',1)->find()){
            throw new Exception(__("请等待上笔提现完成"));
        }
        if($cash_sxf_usdt>0){
            $usdt_sxf=bcmul($price,$cash_sxf_usdt/100,6);
        }
        if($cash_sxf_usdt_num>0){
            $usdt_num_sxf=$cash_sxf_usdt_num;
        }
        if($cash_sxf_oce>0){
            $oce_sxf=bcdiv($cash_sxf_oce,$coin_price,6);
        }
        if($cash_sxf_point>0){
            $point_sxf=bcmul($price,$cash_sxf_point/100,6);
        }
        if($cash_sxf_direct>0){
            $direct_sxf=bcmul($price,$cash_sxf_direct/100,6);
        }
        if($user->balance<$oce_sxf){
            throw new Exception(__("OCE不足"));
        }
        if($user->point<$point_sxf){
            throw new Exception(__("信用额度不足"));
        }
        if($user->direct<$direct_sxf){
            throw new Exception(__("涡轮值不足"));
        }
        $model = new self();
        $model->uid = $user->uid;
        $model->address = $user->address;
        $model->price = $price;
        $model->money = $price;
        $model->credittype=$credittype;
        if($usdt_sxf>0){
            $model->service = $usdt_sxf;
            $model->money = bcsub($model->price,$model->service,6);
        }
        if($usdt_num_sxf>0){
            $model->service = $usdt_sxf+$usdt_num_sxf;
            $model->money = bcsub($model->price,$model->service,6);
        }
        $model->oce=$oce_sxf;
        $model->point=$point_sxf;
        $model->direct=$direct_sxf;
        $model->status = 1;
        $model->save();
        Money::change_money($user->uid,-1*$price,Money::CASH,'申请提现');
        if($oce_sxf>0){
            Balance::change_money($user->uid,-1*$oce_sxf,Balance::CASH,'提现手续费');
        }
        if($point_sxf>0){
            Point::change_money($user->uid,-1*$point_sxf,Point::CASH,'提现扣除');
        }
        if($direct_sxf>0){
            Direct::change_money($user->uid,-1*$direct_sxf,Direct::CASH,'提现扣除');
        }

        return [
            "id"=>$model->id,
            "status"=>$model->status,
        ];
    }


    /**
     * 生成提现参数
     */
    public static function getClaimInfo($uid,$id)
    {
        $withdraw = self::where("id",$id)->where("uid",$uid)->where("status",2)->find();
        if(empty($withdraw)){
            throw new Exception(__("提现信息获取失败"));
        }
        $rand = $withdraw->id;
        $domain = Config::get("site.withdraw_address_key");
        $amount = bcmul($withdraw->money, 1000000000000000000, 0);
        $abi = new Ethabi([
            'address' => new Address(),
            'bytes' => new Bytes(),
            'string' => new Str(),
            'uint' => new Uinteger()
        ]);
        $privateKey = Config::get("site.admin_address_key");
        if(empty($domain) || empty($privateKey)){
            throw new Exception(__("系统维护中"));
        }
        $privateKey = Aes::decrypt($privateKey);
        if(empty($privateKey)){
            throw new Exception(__("配置参数异常"));
        }
        if($withdraw->credittype == "credit1") {
            $daibiToken = Config::get("site.usdt_address");
        }elseif($withdraw->credittype == "credit2") {
            $daibiToken = Config::get("site.cz_address");
        }elseif($withdraw->credittype == "credit4") {
            $daibiToken = Config::get("site.cake_address");
        }elseif($withdraw->credittype == "credit5") {
            $daibiToken = Config::get("site.lp_address");
        }else{
            throw new Exception(__("代币信息异常"));
        }
        $time = time();
        $message = $abi->encodeParameters(['bytes32','address', 'uint', 'address', 'uint','uint'], [$domain,  $withdraw->address,  $rand,$daibiToken, $amount,$time]);
        $hash = Utils::sha3($message);
        $ec = new EC('secp256k1');
        // 从私钥生成公钥和地址
        $keyPair = $ec->keyFromPrivate($privateKey);
        // 对哈希值进行签名
        $signature = $keyPair->sign($hash,[
            'canonical' => true
        ]);

        // 将签名结果与公钥和前缀进行编码，生成一个以太坊格式的签名
        $v = 27 + $signature->recoveryParam;
        $r = '0x'.$signature->r->toString('hex');
        $s = '0x'.$signature->s->toString('hex');
        unset($privateKey);

        return [
            "a"=>Config::get("site.withdraw_address"),
            'amount'=>$amount,
            'rand'=>$rand,
            "token"=>$daibiToken,
            'v' => $v,
            'r' => $r,
            's' => $s,
            "time"=>$time
        ];
    }

    /**
     * 提现状态变动
     */
    public static function updateOrder($info)
    {
        $order = self::where("status",2)->where("id",$info->params1)->where("money",$info->params2)->find();
        if(empty($order)){
            return false;
        }
        $order->hash = $info->hash;
        $order->status = 3;
        $order->save();
    }

}
