<?php
namespace app\common\library;
use fast\Http;
use GuzzleHttp\Client;
use Pelieth\LaravelEcrecover\EthSigRecover;
use think\Cache;
use think\Config;
use think\Db;
use think\Exception;
use think\Log;
use Web3\Utils;
use Web3p\EthereumTx\Transaction;

class Hash{
    public $apikey = "KC6MBK61RWMQXFMIAT9UJQE714NJPDPVWK";
    public $url = "https://api.bscscan.com/";
    public $chainId = 56;
    public function __construct()
    {
//        $this->url = "https://api-testnet.bscscan.com/";
//        $this->chainId = 97;

    }
    public  function crontab()
    {
        $address = Config::get("site.node_address");
        if(!empty($address)){
            $this->crontabHash($address,["paynode"]);
            sleep(1);
        }
        $address = Config::get("site.code_address");
        if(!empty($address)){
            $this->crontabHash($address,["paycode"]);
            sleep(1);
        }
        $address = Config::get("site.cz_address");
        if(!empty($address)){
            $this->crontabHash($address,["lpinfo"]);
            sleep(1);
        }
        $address = Config::get("site.game_address");
        if(!empty($address)){
            $this->crontabHash($address,["rechargeinfo","exchangeinfo","winninginfo","exchangecakeinfo","UserAddLp","exchangeczinfo"]);
            sleep(1);
        }
        $address = Config::get("site.withdraw_address");
        if(!empty($address)){
            $this->crontabHash($address,["withdraw"]);
            sleep(1);
        }
    }
    /**
     * 定时拉取数据
     */
    public function crontabHash($address,$types)
    {
        $startBlock = \app\admin\model\contract\Hash::where('types',"in",$types)->max("block");
        if(empty($startBlock)){
            $startBlock = 0;
        }
        $block = Cache::get("start-block-".$address);
        //$block = 0;
        $startBlock = max($block,$startBlock);
        $url = $this->url."api?module=logs&action=getLogs&address=".$address."&fromBlock=".$startBlock."&endblock=999999999&apikey=".$this->apikey;
        $data = Http::get($url);
        $data = json_decode($data,true);
        if(!empty($data) && $data["status"] == 1) {
            foreach ($data["result"] as $k => $v) {
                $types = self::getTypes($v["topics"][0]);
                if (empty($types)) {
                    continue;
                }
                $logIndex = self::getChangeInfo($v["logIndex"]);
                if(in_array($types,["paycode","paynode"])){
                    $info = \app\admin\model\contract\Hash::where('hash', $v['transactionHash'])->where("types", $types)->find();
                }else {
                    $info = \app\admin\model\contract\Hash::where('hash', $v['transactionHash'])->where("types", $types)->where("logIndex", $logIndex)->find();
                }
                if (!empty($info)) {
                    continue;
                }
                $block = self::getChangeInfo($v["blockNumber"]);
                Cache::set("start-block-" . $address, $block, 300);
                $time = self::getChangeInfo($v["timeStamp"]);
                Db::startTrans();
                try {
                    \app\admin\model\contract\Hash::addInfo([
                        "address" => $address,
                        "types" => $types,
                        "hash" => $v["transactionHash"],
                        "block" => $block,
                        "time" => $time,
                        "logIndex"=>$logIndex,
                        "info" => $v["topics"],
                    ]);
                    Db::commit();
                } catch (\Exception $e) {
                    Db::rollback();
                    //var_dump($e->getMessage());
                    Log::info("拉取数据报错:" . $e->getMessage());
                }
            }
        }
        return true;
    }
    /**
     * 记录类型转换
     * @param $types
     * @return mixed
     */
    public static function getTypes($types)
    {
        $data = array(
            "0x2961048fd9a21e7e52824631247897f38f5f24b2b3c0ffa338723a5b0a3b5d8b"=>"paynode",
            "0x5ee7c7c1414177ca3c59f50bf8f128182ec907570cfbd9b42182a2688da1ce6c"=>"paycode",
            "0x7452fa62425b371ec7a7cd40e81c41c3d4c0f889daf35813e3a000f64cf9ad99"=>"lpinfo",
            "0x7226d2766966259c1b97da9da9efb5183a9730da158b5d69073fc5b2c58127ec"=>"rechargeinfo",
            "0x551b4b5b7495b26a66efcbbb1a30f702c0aa9b87899c6b607be3d766500d6480"=>"exchangeinfo",
            "0x4a4bb2e28257d0aa6ae8a42531a1c674c8f13971ec830aa6d993f78165225776"=>"winninginfo",
            "0xf99db5b2170454d82deeca633521a788cca64e9b893c053ca7b23fb5a8ab17a2"=>"exchangecakeinfo",
            "0x1d4da51b8f43950e891b34fba74cd9380b506490c6047e4a6b37b8b23a407a71"=>"UserAddLp",
            "0xdf273cb619d95419a9cd0ec88123a0538c85064229baa6363788f743fff90deb"=>"withdraw",
            "0xeaf322e0c8812e2ce86be37c787a49ea2338008ac5d9a5846b3a8ae15d56fca1"=>"exchangeczinfo",
            "0x375a9d85560fad2e00bdb47c9996b19be19b56678ea827cda53ba369c375816d"=>"UserCancelLp",
        );
        return isset($data[$types])?$data[$types]:null;
    }
    /**
     * 十六进制转换
     */
    public static function getChangeInfo($string)
    {
        return hexdec($string);
    }
    /**
     * 获取钱包地址
     */
    public function verifyMessage($msg, $signature) {
        $ethSigUtil = new EthSigRecover();
        $result = $ethSigUtil->personal_ecRecover($msg, $signature);
        return $result;
    }
}
