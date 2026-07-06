<?php

namespace app\admin\model\contract;

use app\common\library\Aes;
use app\common\library\Eth;
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


class Lp extends Model
{





    // 表名
    protected $name = 'contract_lp';

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
     * 添加lp 记录
     */
    public static function addUserLp($info,$price,$staticPrice = 0)
    {
        $model = new self();
        $model->orderId = $info["id"];
        $model->types = 1;
        $model->uid = $info["uid"];
        $model->address = $info["address"];
        $model->price = $price;
        $model->staticPrice = $staticPrice;
        $model->status = 1;
        $model->save();
    }

    /**
     * 添加lp 记录
     */
    public static function addCancelLp($uid,$price)
    {
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        if($user->credit5 < $price){
            throw new Exception(__("金额不足"));
        }
        $model = new self();
        $model->orderId = time();
        $model->types = 2;
        $model->uid = $uid;
        $model->address = $user["address"];
        $model->price = $price;
        $model->status = 1;
        $model->save();
        Rebate::saveRebateInfo([
            "uid"=>$uid,
            "credittype"=>"credit5",
            "types"=>"cancellp",
            "orderId"=>$model->id,
            "price"=>-$price,
        ]);
        return [
            "id"=>$model->id,
        ];
    }

    /**
     * 撤回信息签名
     */
    public static function getLpInfo($uid,$id)
    {
        $order = self::where("uid",$uid)->where("id",$id)->where("status",1)->find();
        if(empty($order)){
            throw new Exception(__("订单信息获取失败"));
        }
        $id = $order->id;
        $domain = Config::get("site.game_address_key");
        $price = bcmul($order->price, 1000000000000000000, 0);
        $abi = new Ethabi([
            'address' => new Address(),
            'bytes' => new Bytes(),
            'string' => new Str(),
            'uint' => new Uinteger()
        ]);
        $privateKey = Config::get("site.sign_address_key");
        if(empty($domain) || empty($privateKey)){
            throw new Exception(__("系统维护中"));
        }
        $privateKey = Aes::decrypt($privateKey);
        if(empty($privateKey)){
            throw new Exception(__("配置参数异常"));
        }
        $time = time();
        $message = $abi->encodeParameters(['bytes32','address', 'uint','uint','uint','uint'], [$domain,  $order->address,  $id, $order->types,$price,$time]);
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
            "a"=>Config::get("site.game_address"),
            'id'=>$id,
            'price'=>$price,
            "types"=>$order->types,
            'v' => $v,
            'r' => $r,
            's' => $s,
            "time"=>$time
        ];
    }
    /**
     * lp 处理
     */
    public static function crontab()
    {
        exit;
        $list = self::where("status",1)->order("id asc")->limit(3)->select();
        if(empty($list)){
            return false;
        }
        $eth = new Eth();
        $gameAddress = Config::get("site.game_address");
        foreach ($list as $ks=>$vs){
            try {
                $hash = $eth->userAddLp($gameAddress, $vs["id"], bcmul($vs["price"], 10 ** 18, 0), $vs["address"]);
                if(strpos($hash,"0x") === false){
                    throw new Exception($hash);
                }
                $vs->hash = $hash;
                $vs->status = 2;
                $vs->save();
            }catch (\Exception $e){
                var_dump($e->getMessage());
            }
            sleep(1);
        }
        return true;
    }

    /**
     * 订单更新
     */
    public static function updateOrder($info)
    {
        $order = self::where("id",$info->params1)->where("status",1)->find();
        if(empty($order)){
            return false;
        }
        $order->lp = $info->params2;
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
        if($order->lp > 0) {
            Rebate::saveRebateInfo([
                "uid" => $order["uid"],
                "credittype" => "credit5",
                "types" => "userAddLp",
                "orderId" => $order["id"],
                "price" => $order->lp,
            ]);
        }
        if ($order->staticPrice > 0) {
            Rebate::saveRebateInfo([
                "uid"=>$order["uid"],
                "credittype"=>"credit1",
                "orderId"=>$order["id"],
                "price"=>$order->staticPrice,
                "types"=>"static"
            ]);
        }
    }
    /**
     * 撤销lp
     */
    public static function cancelUpdateOrder($info)
    {
        $order = self::where("id", $info->params1)->where("status", 1)->where("price",$info->params2)->find();
        if (empty($order)) {
            return false;
        }
        $order->hash = $info->hash;
        $order->status = 2;
        $order->save();
        //
    }
}
