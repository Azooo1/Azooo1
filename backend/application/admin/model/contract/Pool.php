<?php

namespace app\admin\model\contract;

use app\common\library\Eth;
use think\Config;
use think\Db;
use think\Exception;
use think\exception\ErrorException;
use think\Model;


class Pool extends Model
{





    // 表名
    protected $name = 'contract_pool';

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
     * 类型
     */
    public static function getTypesInfo()
    {
        return [
            1=>"保险池",//下单出局后
            2=>"中奖池",//下单出局后
            3=>"节点分红池",//下单出局后
            4=>"价格",//每日更新
            5=>"爆仓门票",//爆仓处理
            11=>"创世节点分红",//激活50%
            12=>"节点分红",//激活50%
            13=>"门票分红",//来源 爆仓门票数据
            14=>"每日通缩",//定时处理
            21=>"博饼lp分红",
            22=>"博饼节点分红",
            23=>"兑换代币分红",
            24=>"添加LP分红",
            25=>"代币分红剩余",
            26=>"lp分红剩余",
        ];
    }

    /**
     * 奖池信息
     */
    public static function startRebate($outInfo)
    {
        //保险池
        $price = Config::get("site.queue_insurance_price");
        if($price>0) {
            self::addPoolInfo(1,$price,$outInfo->round);
        }
        //中奖池
        $price = Config::get("site.queue_lottery_price");
        if($price>0){
            self::addPoolInfo(2,$price,$outInfo->round);
        }
        //节点分红池
        $price = Order::getIndexPrice($outInfo->pindex,3);
        if($price>0){
            self::addPoolInfo(3,$price,$outInfo->round);
        }
    }


    /**
     * 添加记录
     */
    public static function addPoolInfo($types,$price,$outId = 0,$count = 0)
    {
        $date = date("Y-m-d");
        if(in_array($types,[1,2,5])) {
            $pool = self::where("date", $date)->where("outId", $outId)->where('types', $types)->find();
        }elseif(in_array($types,[3,23,24,13])) {
            $pool = self::where("outId", $outId)->where('types', $types)->find();
        }elseif(in_array($types,[25,26])){
            $pool = self::where('types', $types)->find();
        }else {
            $pool = self::where("date", $date)->where('types', $types)->find();
        }
        if(empty($pool)){
            $pool = new self();
            $pool->date = $date;
            $pool->types = $types;
            $pool->title = self::getTypesInfo()[$types];
            $pool->price = 0;
            $pool->userPrice = 0;
            $pool->status = 1;
        }
        if(!empty($outId)){
            $pool->outId = $outId;
        }
        if($types == 14 || $types == 25 || $types == 26){
            $pool->price = $price;
        }else {
            $pool->price = bcadd($pool->price, $price, 6);
        }
        if($count>0){
            $pool->count = $count;
            $pool->userPrice = bcdiv($pool->price,$count,6);
        }
        $pool->save();
    }
    /**
     * 爆仓后当日数据更新
     */
    public static function updateQueueInfo($round,$type)
    {
        $info = Queue::where("round",$round)->where("status",2)->find();
        if(empty($info)){
            return false;
        }
        if($info->bxStatus == 1 && $type == 23){
            $info->bxStatus = 2;
            $info->save();
        }elseif($info->zjStatus == 1 && $type == 24){
            $info->zjStatus = 2;
            $info->save();
        }elseif($info->cakeStatus == 1 && $type == 13){
            $info->cakeStatus = 2;
            $info->save();
        }
    }
    /**
     * 获取代币价格
     */
    public static function getLinePrice()
    {
        $pool = self::where('types',4)->find();
        if(empty($pool)){
            return 0;
        }
        return $pool->price;
    }
    /**
     * 定时拉取价格
     */
    public static function getDaibiPrice()
    {
        $eth = new Eth();
        $usdtAddress = Config::get("site.usdt_address");
        $lpAddress = Config::get("site.lp_address");
        $czAddress = Config::get("site.cz_address");
        $usdtNum = $eth->getBalance($usdtAddress,$lpAddress);
        $czNum = $eth->getBalance($czAddress,$lpAddress);
        $price = bcdiv($usdtNum,$czNum,8);
        if($price<=0){
            return false;
        }
        $date = date("Y-m-d");
        $pool = self::where("date",$date)->where('types',4)->find();
        if(empty($pool)){
            $pool = new self();
            $pool->date = $date;
            $pool->types = 4;
            $pool->title = "每日价格";
            $pool->status = 1;
        }
        $pool->price = $price;
        $pool->save();
    }
    /**
     * 获取价格
     */
    public static function getCzPrice()
    {
        $pool = self::where('types',4)->order("id desc")->find();
        return $pool?$pool->price:0;
    }
    /**
     * 分红
     */
    public function crontab()
    {
        //①激活账号的5U: 创世节点(客户提供)分50% 节点分50%
        // 每天分  11  12
        $this->codeCrontab();
        $this->codeCrontabPool();
        //手续费lp分 21  分昨天的
        $this->serviceLpPool();
        //手续费节点分 22 分昨天的
        $this->serviceNodePool();
        //保险池分红 23
        $this->bxCrontabPool();
        //中奖池分红 24
        $this->zjCrontabPool();
        //门票爆仓人分红 13
        $this->cakeCrontabPool();
        //节点池分红 3
        $this->nodeCrontabPool();
    }
    /**
     * 激活分红
     */
    public function codeCrontab()
    {
        $date = date("Y-m-d");
        $info = self::where("date",$date)->where("types",11)->find();
        if(!empty($info)){
            return false;
        }
        $entime = strtotime($date);
        $starttime = $entime - 86400;
        $dayPrice = Code::where("createtime",">=",$starttime)->where("createtime","<",$entime)->where("status",2)->sum("price");
        if($dayPrice<=0){
            return false;
        }
        $percent1 = Config::get("site.node_pool_percent1");
        $price1 = bcmul($dayPrice,$percent1*0.01,6);
        if($price1>0){
            $count = User::where("superNode",1)->count();
            self::addPoolInfo(11,$price1,0,$count);
        }
        $percent2 = Config::get("site.node_pool_percent2");
        $price2 = bcmul($dayPrice,$percent2*0.01,6);
        if($price2>0){
            self::addPoolInfo(12,$price2);
        }
    }
    /**
     * 激活账户分红
     */
    public function codeCrontabPool()
    {
        $date = date("Y-m-d");
        //50% 超级节点
        $info = self::where("date",$date)->where("types",11)->where("status",1)->find();
        if(!empty($info)){
            $maxUid = !empty($info->maxUid)?$info->maxUid:0;
            $list = User::where("superNode",1)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
            if(empty($list)){
                $info->status = 2;
                $info->save();
            }
            foreach ($list as $k=>$v){
                $maxUid = $v["uid"];
                Rebate::saveRebateInfo([
                    "uid"=>$v["uid"],
                    "credittype"=>"credit1",
                    "types"=>"superCodePool",
                    "price"=>$info["userPrice"],
                    "orderId"=>$info["id"],
                ]);
            }
            $info->maxUid = $maxUid;
            $info->save();
        }
        //50% 节点
        $info = self::where("date",$date)->where("types",12)->where("status",1)->find();
        if(!empty($info)){
            $maxUid = !empty($info->maxUid)?$info->maxUid:0;
            $list = User::where("node",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
            if(empty($list)){
                $info->status = 2;
                $info->save();
            }
            $percentList = Config::get("site.node_level_percent");
            foreach ($list as $k=>$v){
                $maxUid = $v["uid"];
                foreach ($percentList as $k1=>$v1){
                    if($v->nodeLevel>=$k1) {
                        $count = User::where("nodeLevel", ">=", $k1)->cache(60)->sum("node");
                        $price = bcmul($v["node"] / $count * $v1 * 0.01, $info["price"], 6);
                        if ($price > 0) {
                            Rebate::saveRebateInfo([
                                "uid" => $v["uid"],
                                "credittype" => "credit1",
                                "types" => "codePool",
                                "price" => $price,
                                "orderId" => $info["id"],
                            ]);
                        }
                    }
                }
            }
            $info->maxUid = $maxUid;
            $info->save();
        }
    }
    /**
     * 门票爆仓人分红
     */
    public function cakeCrontab()
    {
        $date = date("Y-m-d",time() - 86400);
        $info = self::where("date",$date)->where("types",5)->where("status",1)->find();
        $queue = null;
        if(empty($info)){
            $queue = Queue::where("status",2)->where("cakeStatus",0)->order("id desc")->find();
            if(empty($queue)){
                return true;
            }
            $info = self::where("outId",$queue->round)->where("types",5)->where("status",1)->find();
            if(empty($info)){
                return true;
            }
        }
        if($info->status  != 1 || $info->price<=0){
            return true;
        }
        $eth = new Eth();
        try{
            $contractAddress = Config::get("site.game_address");
            $hash = $eth->exchangeCake($contractAddress,$info->id,bcmul($info->price,10**18,0));
            if(empty($hash) || strpos($hash,"0x") === false){
                throw new Exception(__("获取失败"));
            }
            $info->hash = $hash;
            $info->status = 2;
            $info->save();
            if($queue) {
                $queue->cakeStatus = 1;
                $queue->save();
            }
        }catch (\Exception $e){
            var_dump($e->getMessage());
            return false;
        }
        return false;
    }
    /**
     * 门票分红
     */
    public function cakeCrontabPool()
    {
        $queue = Queue::where("status", 2)->where("cakeStatus", 2)->order("id desc")->find();
        if (empty($queue)) {
            return true;
        }
        $info = self::where("outId",$queue->round)->where("types",13)->where("status",1)->order("id desc")->find();
        if(!empty($info)){
            if($info->userPrice<=0){
                $count = User::where("status",1)->sum("bcPrice");
                $info->count = $count;
                $info->userPrice = $count>0?bcdiv($info->price, $count, 6):0;
                if($info->userPrice <= 0){
                    $info->status = 2;
                }
                $info->save();
                return false;
            }
            $maxUid = !empty($info->maxUid)?$info->maxUid:0;
            $list = User::where("bcPrice",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
            if(empty($list)){
                $info->status = 2;
                $info->save();
            }
            foreach ($list as $k=>$v){
                $maxUid = $v["uid"];
                $price = bcmul($v["bcPrice"],$info["userPrice"],6);
                if($price>0) {
                    Rebate::saveRebateInfo([
                        "uid" => $v["uid"],
                        "credittype" => "credit4",
                        "types" => "cakePool",
                        "price" => $price,
                        "orderId" => $info["id"],
                    ]);
                }
            }
            $info->maxUid = $maxUid;
            $info->save();
        }
    }
    /**
     * 手续费lp分红 21
     */
    public function serviceLpPool()
    {
        //$date = date("Y-m-d",time());
        $date = date("Y-m-d",time() - 86400);
        $info = self::where("date",$date)->where("types",21)->find();
        if(empty($info) || $info->status != 1){
            return false;
        }
        if($info->userPrice<=0){
            $count = User::where("status",1)->sum("credit5+credit6");
            $info->count = $count;
            $info->userPrice = $count>0?bcdiv($info->price, $count, 6):0;
            if($info->userPrice <= 0){
                $info->status = 2;
            }
            $info->save();
            return false;
        }
        $maxUid = !empty($info->maxUid)?$info->maxUid:0;
        $list = User::where("credit5|credit6",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
        if(empty($list)){
            $info->status = 2;
            $info->save();
        }
        foreach ($list as $k=>$v){
            $maxUid = $v["uid"];
            $price = bcmul($v["credit6"]+$v["credit5"],$info["userPrice"],6);
            if($price>0) {
                Rebate::saveRebateInfo([
                    "uid" => $v["uid"],
                    "credittype" => "credit2",
                    "types" => "czLpPool",
                    "price" => $price,
                    "orderId" => $info["id"],
                ]);
            }
        }
        $info->maxUid = $maxUid;
        $info->save();
    }
    /**
     * 手续费节点分红 22
     */
    public function serviceNodePool()
    {
        //$date = date("Y-m-d",time());
        $date = date("Y-m-d",time() - 86400);
        $info = self::where("date",$date)->where("types",22)->order("id desc")->find();
        if(empty($info) || $info->status != 1){
            return false;
        }
        $maxUid = !empty($info->maxUid)?$info->maxUid:0;
        $list = User::where("node",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
        if(empty($list)){
            $info->status = 2;
            $info->save();
        }
        $percentList = Config::get("site.node_level_percent");
        foreach ($list as $k=>$v){
            $maxUid = $v["uid"];
            foreach ($percentList as $k1=>$v1){
                if($v->nodeLevel>=$k1) {
                    $count = User::where("nodeLevel", ">=", $k1)->cache(60)->sum("node");
                    $price = bcmul($v["node"] / $count * $v1 * 0.01, $info["price"], 6);
                    if ($price > 0) {
                        Rebate::saveRebateInfo([
                            "uid" => $v["uid"],
                            "credittype" => "credit2",
                            "types" => "czNodePool",
                            "price" => $price,
                            "orderId" => $info["id"],
                        ]);
                    }
                }
            }
        }
        $info->maxUid = $maxUid;
        $info->save();
    }
    /**
     * 保险池分红 23
     */
    public function bxCrontabPool()
    {
        $queue = Queue::where("status", 2)->where("bxStatus", 2)->order("id desc")->find();
        if (empty($queue)) {
            return true;
        }
        $info = self::where("outId",$queue->round)->where("types",23)->where("status",1)->order("id desc")->find();
        if(empty($info)){
            return false;
        }
        if($info->userPrice<=0){
            $countPrice = self::where("types","in",[23,25])->where("status",1)->sum("price");
            $count = User::where("bcPrice",">",0)->sum("bcPrice");
            $info->count = $count;
            $percent = Config::get("site.queue_pool_percent1");
            $info->userPrice = $count>0?bcdiv($countPrice*$percent*0.01, $count, 6):0;
            if($info->userPrice <= 0){
                $info->status = 2;
            }
            $info->save();
            Pool::addPoolInfo(25,$count>0?$countPrice*(100-$percent)*0.01:$info->price);
            return false;
        }
        $maxUid = !empty($info->maxUid)?$info->maxUid:0;
        $list = User::where("bcPrice",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
        if(empty($list)){
            $info->status = 2;
            $info->save();
        }
        foreach ($list as $k=>$v){
            $maxUid = $v["uid"];
            $price = bcmul($v["bcPrice"],$info["userPrice"],6);
            if($price>0) {
                Rebate::saveRebateInfo([
                    "uid" => $v["uid"],
                    "credittype" => "credit2",
                    "types" => "czBxPool",
                    "price" => $price,
                    "orderId" => $info["id"],
                ]);
            }
        }
        $info->maxUid = $maxUid;
        $info->save();
    }
    /**
     * 中奖池分红 24
     */
    public function zjCrontabPool()
    {
        $queue = Queue::where("status", 2)->where("zjStatus", 2)->order("id desc")->find();
        if (empty($queue)) {
            return true;
        }
        $info = self::where("outId",$queue->round)->where("types",24)->where("status",1)->order("id desc")->find();
        if(empty($info)){
            return false;
        }
        $count = Config::get("site.queue_pool_usernum");
        if($info->userPrice<=0 || $info->maxUid == 0){
            $countPrice = self::where("types","in",[24,26])->where("status",1)->sum("price");
            //爆仓信息
            $info->maxUid = $queue->round;
            $percent = Config::get("site.queue_pool_percent2");
            $info->count = $count;
            $info->userPrice = $count>0?bcdiv($countPrice*$percent*0.01, $count, 6):0;
            if($info->userPrice <= 0){
                $info->status = 2;
            }
            $info->save();

            Pool::addPoolInfo(26,$count>0?$countPrice*(100-$percent)*0.01:$info->price);
            return false;
        }
        $list = Order::where("status",3)->where("round",$info->maxUid)->order("id desc")->limit($count)->select();
        if(empty($list)){
            $info->status = 2;
            $info->save();
        }
        foreach ($list as $k=>$v){
            $price = bcmul(1,$info["userPrice"],6);
            if($price>0) {
                Rebate::saveRebateInfo([
                    "uid" => $v["uid"],
                    "credittype" => "credit5",
                    "types" => "czZjPool",
                    "price" => $price,
                    "orderId" => $info["id"],
                ]);
            }
        }
        $info->status = 2;
        $info->save();
    }
    /**
     * 每日节点分红
     */
    public function nodeCrontabPool()
    {
        $queue = Queue::where("status",2)->where("nodeStatus",0)->order("id desc")->find();
        if(empty($queue)){
            return false;
        }
        $info = self::where("outId",$queue->round)->where("types",3)->where("status",1)->find();
        if(!empty($info)){
            $maxUid = !empty($info->maxUid)?$info->maxUid:0;
            $list = User::where("node",">",0)->where("uid",">",$maxUid)->order("uid asc")->limit(100)->select();
            if(empty($list)){
                $info->status = 2;
                $info->save();
                $queue->nodeStatus = 1;
                $queue->save();
            }
            $percentList = Config::get("site.node_level_percent");
            foreach ($list as $k=>$v){
                $maxUid = $v["uid"];
                foreach ($percentList as $k1=>$v1){
                    if($v->nodeLevel>=$k1) {
                        $count = User::where("nodeLevel", ">=", $k1)->cache(60)->sum("node");
                        $price = bcmul($v["node"] / $count * $v1 * 0.01, $info["price"], 6);
                        if ($price > 0) {
                            Rebate::saveRebateInfo([
                                "uid" => $v["uid"],
                                "credittype" => "credit1",
                                "types" => "codePool",
                                "price" => $price,
                                "orderId" => $info["id"],
                            ]);
                        }
                    }
                }
            }
            $info->maxUid = $maxUid;
            $info->save();
        }
    }
    /**
     * 每日通缩
     */
    public function dayBurnInfo()
    {
        $date = date("Y-m-d");
        $info = self::where("date",$date)->where("types",14)->find();
        if(empty($info)){
            $percent = Config::get("site.day_burn_percent");
            if($percent<=0){
                return true;
            }
            self::addPoolInfo(14,Config::get("site.day_burn_percent"));
            return false;
        }
        if($info->status != 1){
            return true;
        }
        $eth = new Eth();
        try{
            $contractAddress = Config::get("site.cz_address");
            $hash = $eth->burnDayPair($contractAddress,bcmul($info->price,100,0));
            if(empty($hash) || strpos($hash,"0x") === false){
                throw new Exception(__("获取失败"));
            }
            if($hash == "Max calls per sec rate limit reached (5/sec)"){
                throw new Exception("Max calls per sec rate limit reached (5/sec)");
            }
            $info->hash = $hash;
            $info->status = 2;
            $info->save();
        }catch (\Exception $e){
            var_dump($e->getMessage());
            return false;
        }
        return false;
    }
    /**
     * 保险池换代币
     */
    public function exchangeCrontab()
    {
        $date = date("Y-m-d",time() - 86400);
        $info = self::where("date",$date)->where("types",1)->where("status",1)->find();
        $queue = null;
        if(empty($info)) {
            $queue = Queue::where("status", 2)->where("bxStatus", 0)->order("id desc")->find();
            if (empty($queue)) {
                return true;
            }
            $info = self::where("outId", $queue->round)->where("types", 1)->where("status",1)->find();
            if (empty($info)) {
                return true;
            }
        }
        if($info->status != 1){
            return true;
        }
        $eth = new Eth();
        try{
            $contractAddress = Config::get("site.game_address");
            $hash = $eth->exchangeDaibi($contractAddress,$info->id,bcmul($info->price,10**18,0));
            if(empty($hash) || strpos($hash,"0x") === false){
                throw new Exception(__("获取失败"));
            }
            if($hash == "Max calls per sec rate limit reached (5/sec)"){
                throw new Exception("Max calls per sec rate limit reached (5/sec)");
            }
            $info->hash = $hash;
            $info->status = 2;
            $info->save();
            if($queue) {
                $queue->bxStatus = 1;
                $queue->save();
            }
        }catch (\Exception $e){
            var_dump($e->getMessage());
            return false;
        }
        return false;
    }
    /**
     * 中奖池兑换
     */
    public function winningPoolCrontab()
    {
        $date = date("Y-m-d",time() - 86400);
        $info = self::where("date",$date)->where("types",2)->where("status",1)->find();
        $queue = null;
        if(empty($info)) {
            $queue = Queue::where("status", 2)->where("zjStatus", 0)->order("id desc")->find();
            if (empty($queue)) {
                return true;
            }
            $info = self::where("outId", $queue->round)->where("types", 2)->where("status",1)->find();
            if (empty($info)) {
                return true;
            }
        }
        if($info->status != 1){
            return true;
        }
        $eth = new Eth();
        try{
            $contractAddress = Config::get("site.game_address");
            $hash = $eth->winningPool($contractAddress,$info->id,bcmul($info->price,10**18,0));
            if(empty($hash) || strpos($hash,"0x") === false){
                throw new Exception(__("获取失败"));
            }
            if($hash == "Max calls per sec rate limit reached (5/sec)"){
                throw new Exception("Max calls per sec rate limit reached (5/sec)");
            }
            $info->hash = $hash;
            $info->status = 2;
            $info->save();
            if($queue) {
                $queue->zjStatus = 1;
                $queue->save();
            }
        }catch (\Exception $e){
            var_dump($e->getMessage());
            return false;
        }
        return false;
    }
}
