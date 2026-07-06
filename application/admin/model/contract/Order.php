<?php

namespace app\admin\model\contract;

use app\admin\model\user\Relation;
use think\Cache;
use think\Config;
use think\Db;
use think\Exception;
use think\Model;


class Order extends Model
{





    // 表名
    protected $name = 'contract_order';

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
     * 订单状态
     */
    public static function getStatusInfo($lang)
    {
        if($lang  == "en"){
            return [
                1=>"Pending elimination",
                2=>"Already eliminated",
                3=>"Exploded warehouse",
            ];
        }else{
            return [
                1=>"待出局",
                2=>"已出局",
                3=>"已爆仓",
            ];
        }
    }
    /**
     * 创建订单
     */
    public static function createOrder($uid,$qid)
    {
        $cache = Cache::get("queue-create-time");
        if(!empty($cache)){
            throw new Exception(__("请5分钟后重试"));
        }
        Cache::set("queue-create-time",1,300);
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        $status = Config::get("site.queue_status");
        if($status != 1){
            throw new Exception(__("未启动"));
        }
        $price3 = Config::get("site.queue_price3");
        $service = Config::get("site.queue_service");
        if($user->credit1 < bcadd($price3,$service,2)){
            throw new Exception(__("金额不足无法支付"));
        }
        //验证条件
        //节点或激活后可购买
        if($user->node<=0){
            $nodeInfo = Code::where("uid",$uid)->where("endtime",">",time())->where("status",2)->find();
            if(empty($nodeInfo)){
                throw new Exception(__("请先购买节点或激活账号"));
            }
        }
        //排队信息
        $queueInfo = Queue::where("id",$qid)->where("status",1)->lock(true)->find();
        if(empty($queueInfo)){
            throw new Exception(__("轮数信息获取失败"));
        }
        //时间结束
        if($queueInfo->endtime < time()){
            throw new Exception(__("购买时间已结束"));
        }
        //自己购买次数限制
        $payNum = Config::get("site.queue_pay_num");
        if($payNum>0){
            $hour = Config::get("site.queue_pay_time");
            $time24 = time() - $hour * 3600;
            $payCount = self::where("round",$queueInfo->round)->where("uid",$uid)->where("createtime",">",$time24)->count();
            if($payCount >= $payNum){
                throw new Exception(__("请稍后重新购买"));
            }
        }
        //购买时间限制
        $payInfo = self::where("round",$queueInfo->round)->where("uid",$uid)->order("id desc")->find();
        if(!empty($payInfo)){
            if($user->node>0){
                $space = Config::get("site.queue_pay_space_node");
            }else {
                $space = Config::get("site.queue_pay_space");
            }
            if($payInfo->createtime + $space * 3600 > time()){
                throw new Exception(__("请稍等一会重新购买"));
            }
        }
        $pindex = $queueInfo->pindex;
        $size = $queueInfo->size;
        $queueNums = pow(2, $queueInfo->size - 1);
        $countNum = Order::where("round",$queueInfo->round)->where("pindex",$queueInfo->pindex)->where("size",$queueInfo->size)->count();
        $countNum = bcadd($countNum, 1, 0);
        if($queueInfo->pindex == 3 && $countNum>$queueNums) {
            $pindex = 1;
            $size = bcadd($queueInfo->size, 1, 0);
            $nums = 1;
        }else{
            if($countNum>$queueNums) {
                $pindex = bcadd($queueInfo->pindex, 1, 0);
                $nums = 1;
            }else{
                $nums = $countNum;
            }
        }
        $price = self::getIndexPrice($pindex);
        if($price <= 0){
            throw new Exception(__("金额异常"));
        }
        $queue = new Queue();
        $queueUpdate = [
            "pindex"=>$pindex,
            "size"=>$size,
            "nums"=>$nums,
            "lock_version"=>bcadd($queueInfo->lock_version,1,0),
        ];
        $resetEnd = Config::get("site.queue_hour_reset_end");
        if(time()> $queueInfo->halftime) {
            if ($queueInfo->endtime - $resetEnd * 3600 < time()){
                //重置时间次数
                $halfNum = Config::get("site.queue_hour_reset_num");
                if ($queueInfo->halfnum < $halfNum) {
                    $queueUpdate["halfnum"] = bcadd($queueInfo->halfnum, 1, 0);
                    $time = time();
                    $queueUpdate["halftime"] = time();
                    $queueUpdate["endtime"] = $queueInfo->endtime - $queueInfo->halftime + $time;
                }
            }
        }else{
            $queueUpdate["halftime"] = time() + Config::get("site.queue_pay_hour")*3600;
            $queueUpdate["endtime"] = time() + Config::get("site.queue_pay_hour")*3600 + Config::get("site.queue_hour_reset")*3600;
        }
        $flag = $queue->save($queueUpdate,["id"=>$qid,"lock_version"=>$queueInfo->lock_version]);
        if($flag == false){
            throw new Exception(__("更新失败"));
        }
        $model = new self();
        $model->uid = $uid;
        $model->address = $user->address;
        $model->round = $queueInfo->round;
        $model->pindex = $pindex;
        $model->size = $size;
        $model->nums = $nums;
        $model->price = $price;
        $model->service = $service;
        $model->status = 1;
        $model->hash = time();
        $model->save();
        //扣钱
        Rebate::saveRebateInfo([
            "uid"=>$uid,
            "credittype"=>'credit1',
            "types"=>"payment",
            "price"=>-bcadd($model->price,$model->service,2),
            "orderId"=>$model->id,
        ]);
        //开始返佣
        self::startRebate($model);
        return [
            "pindex"=>$pindex,
            "price"=>$price,
        ];
    }
    /**
     * 处理返佣
     */
    public static function startRebate($model)
    {
        Pool::addPoolInfo(5, $model->service, $model->round);
        //判断是否满足出局
        if($model->pindex == 1 && $model->nums%2 != 0){
            return true;
        }
        if($model->pindex == 1){
            $size = bcsub($model->size,1,0);
            $pindex = 3;
            $nums = bcdiv($model->nums,2,0);
        }else{
            $pindex = bcsub($model->pindex,1,0);
            $size = $model->size;
            $nums = $model->nums;
        }
        $outInfo = self::where("round",$model->round)->where("size",$size)->where("pindex",$pindex)->where("nums",$nums)->where("status",1)->find();
        if(empty($outInfo)){
            return false;
        }
        //推荐奖励
        self::startTeamRebate($model);
        $time = Config::get("site.queue_time_paidui");
        $outInfo->endtime = time() + $time*3600;
        $outInfo->status = 2;
        $outInfo->save();
        //保险池
        //中奖池
        //节点分红池
        Pool::startRebate($outInfo);
    }

    /**
     * 获取下一轮金额
     */
    public static function getRoundPrice($queueInfo)
    {
        $pindex = $queueInfo->pindex;
        $queueNums = pow(2, $queueInfo->size - 1);
        $countNum = Order::where("round",$queueInfo->round)->where("pindex",$queueInfo->pindex)->where("size",$queueInfo->size)->count();
        $countNum = bcadd($countNum, 1, 0);
        if($queueInfo->pindex == 3 && $countNum>$queueNums) {
            $pindex = 1;
        }else{
            if($countNum>$queueNums) {
                $pindex = bcadd($queueInfo->pindex, 1, 0);
            }
        }
        $service = Config::get("site.queue_service");
        return bcadd(self::getIndexPrice($pindex),$service,2);
    }
    /**
     * 获取金额
     */
    public static function getIndexPrice($index,$types = 1)
    {
        if($types == 2){
            //静态收益
            $price = Config::get("site.queue_static_price".$index);
        }elseif($types == 3){
            //节点金额
            $price = Config::get("site.queue_node_price".$index);
        }else{
            //支付金额
            $price = Config::get("site.queue_price".$index);
        }
        return $price;
    }
    /**
     * 基础返佣
     * out 出局
     * static 静态
     */
    public static function startUserRebate($order,$price,$types)
    {
        Rebate::saveRebateInfo([
            "uid"=>$order->uid,
            "credittype"=>"credit1",
            "orderId"=>$order->id,
            "price"=>$price,
            "types"=>$types
        ]);
    }
    /**
     * 推荐奖励处理
     */
    public static function startTeamRebate($order)
    {
        $user = \app\admin\model\User::where("id",$order->uid)->find();
        $relation = explode("-",$user["relation"]);
        $level = 0;
        $price = Config::get("site.queue_recommend_price");
        if($price<=0){
            return true;
        }
        $maxLevel = Config::get("site.queue_recommend_level");
        foreach ($relation as $ks=>$vs){
            $countLevel = $level + 1;
            if($vs<=0 || $level>$maxLevel){
                continue;
            }
            //自己下单有效
            $isValid = Order::where("uid",$vs)->where("status","in",[1,2])->where("outStatus",0)->find();
            if(empty($isValid)){
                continue;
            }
            //推荐几层拿几代
            $uidList = Relation::where("pid",$vs)->where("level",1)->column("id,uid");
            if(empty($uidList)){
                continue;
            }
            $count = Order::where("uid","in",array_values($uidList))->where("status","in",[1,2])->where("outStatus",0)->group("uid")->count();
            if($count < $countLevel){
                continue;
            }
            Rebate::saveRebateInfo([
                "uid"=>$vs,
                "credittype"=>"credit1",
                "types"=>'recommend',
                "price"=>$price,
                "orderId"=>$order->id
            ]);
            $level++;
        }
        if($level<$maxLevel){
            $recommendPrice = bcmul($price,$maxLevel - $level,2);
            $recommendUid = Config::get("site.queue_recommend_uid");
            if($recommendPrice>0 && $recommendUid>0) {
                Rebate::saveRebateInfo([
                    "uid" => $recommendUid,
                    "credittype" => "credit1",
                    "types" => 'recommend',
                    "price" => $recommendPrice,
                    "orderId" => $order->id
                ]);
            }
        }
        return true;
    }

    /**
     * 爆仓处理
     */
    public function marginCall()
    {
        $queue = Queue::where("endtime","<",time())->where("status",1)->find();
        if(empty($queue)){
            return false;
        }
        $list = self::where("status",1)->order("id asc")->limit(100)->select();
        if(empty($list)){
            $queue->status = 2;
            $queue->save();
            return;
        }
        $percent = Config::get("site.queue_bccz_percent");
        User::where("bcPrice",">",0)->update(["bcPrice"=>0]);
        foreach ($list as $ks=>$vs){
            Db::startTrans();
            try {
                $vs->status = 3;
                $vs->save();
                //cz 额度
                $price = bcmul($vs->price,$percent*0.01,6);
                if($price>0) {
                    Rebate::saveRebateInfo([
                        "uid" => $vs->uid,
                        "credittype" => "credit3",
                        "types" => 'bcGive',
                        "price" => $price,
                        "orderId"=>$vs->id,
                    ]);
                }
                $user = User::getUserInfo($vs->uid);
                $user->bcPrice = bcadd($vs->price, $user->bcPrice, 6);
                $user->save();
                Db::commit();
            }catch (\Exception $e){
                Db::rollback();
                var_dump($e->getMessage());
            }
        }
        return true;
    }
    /**
     * 定时处理返佣
     */
    public function crontab()
    {
        $list = self::where("status",2)->where("endtime","<",time())->where("outStatus",0)
            ->order("id asc")->limit(100)->select();
        if(empty($list)){
            return false;
        }
        $percent1 = Config::get("site.queue_static_percent1");
        $percent2 = Config::get("site.queue_static_percent2");
        foreach ($list as $ks=>$vs){
            Db::startTrans();
            try {
                $vs->outStatus = 1;
                $vs->save();
                //出局奖励
                $price = bcadd($vs->price, $vs->service, 2);
                if ($price > 0) {
                    self::startUserRebate($vs, $price, "out");
                }
                //静态奖励
                $price = self::getIndexPrice($vs->pindex, 2);
                $price1 = bcmul($price,$percent1*0.01,6);
                $price2 = bcmul($price,$percent2*0.01,6);
                Lp::addUserLp($vs,$price2,$price1);
                Db::commit();
            }catch (\Exception $e){
                Db::rollback();
                var_dump($e->getMessage());
            }
        }
        return true;
    }
    /**
     * 处理预约排队订单
     */
    public function yyCrontab()
    {
        $status = Config::get("site.queue_status");
        if($status != 1){
            return false;
        }
        $queueInfo = Queue::getInfo();
        //时间结束
        if(empty($queueInfo) || $queueInfo->endtime < time()){
            return false;
        }

        $price3 = Config::get("site.queue_price3");
        $service = Config::get("site.queue_service");
        $price = bcadd($price3,$service,6);
        $list = User::where("bookStatus",1)->where("credit1",">=",$price)->order("bcPrice desc,id asc")->limit(2)->select();
        foreach ($list as $ks=>$vs) {
            Db::startTrans();
            try {
                Order::createOrder($vs["uid"], $queueInfo["id"]);
                Db::commit();
            } catch (\Exception $e) {
                Db::rollback();
                var_dump($e->getMessage());
            }
            sleep(1);
        }
    }
}
