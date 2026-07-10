<?php

namespace app\api\controller\contract;

use app\admin\model\article\Slide;
use app\admin\model\contract\Feedback;
use app\admin\model\contract\Order;
use app\admin\model\contract\Rule;
use app\admin\model\contract\Socerule;
use app\admin\model\pledge\Order as PledgeOrder;
use app\admin\model\pledge\OrderLog;
use app\admin\model\contract\Rebate;
use app\admin\model\pledge\Pledge as PledgeM;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use app\admin\model\user\Amount;
use app\admin\model\user\Soce;
use app\admin\model\user\Relation;
use app\common\controller\Api;
use think\Cache;
use think\Config;
use think\Db;

/**
 * 用户信息
 */
class User extends Api
{
    /**
     * 基础信息
     */
    public function index()
    {
        $referrer = $this->auth->referrer;
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $addressList = array_values(Config::get("site.one_address"));
        $node=0;
        if($user->node==1){
            $node=1;
        }else{
            if($user->real==1){
                $node=2;
            }
        }
        $data = [
            "uid"=>$this->auth->id,
            "referrer" => $referrer ? 1 : 0,
            "posterUrl"=>"",
            "node"=>$node,
            "nodeRule"=>htmlspecialchars_decode(Config::get("site.node_rule_".$this->request->langset())),
            "nodeInfo"=>htmlspecialchars_decode(Config::get("site.node_info_".$this->request->langset())),
            "nodePrice"=>Config::get("site.node_price"),
        ];
        if(empty($user["pid"])){
            $data["bindStatus"] = 0;
            foreach ($addressList as $ks=>$vs){
                if(strtolower($vs) == strtolower($user->address)){
                    $data["bindStatus"] = 1;
                }
            }
        }else{
            $data["bindStatus"] = 1;
        }
        if(!empty($data["bindStatus"])){
            $data["posterUrl"] = "https://".request()->host()."/dapp/#/?address=".$user->address;
        }
        $this->success(__("会员信息"),$data);
    }
    /**
     * 上级地址绑定
     */
    public function bindAddress()
    {
        $address = $this->request->post("address");
        if (empty($address)) {
            $this->error(__("地址信息异常"));
        }
        $cache = Cache::get("user-bind-" . $this->auth->id);
        if (!empty($cache)) {
            $this->error(__("请稍后重试"));
        }
        Cache::set("user-bind-" . $this->auth->id, 1, 3);
        Db::startTrans();
        try {
            \app\admin\model\contract\User::bindAddressInfo($this->auth->id, $address);
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("绑定成功"));
    }
    /**
     * 我的团队
     */
    public function getTeamList()
    {
        $uid=$this->auth->id;
        $user = \app\admin\model\contract\User::getUserInfo($uid);
        $list = \app\admin\model\contract\User::where('pid',$user['uid'])
            ->order('line desc, id desc')
            ->field('id,uid,real')
            ->paginate(intval($this->limit));
        //直推列表
        $zhiList = \app\admin\model\contract\User::where("pid",$uid)->column("id,uid");
        //团队总人数
        $uidList = Relation::where("pid",$uid)->cache(60)->column("id,uid");
        $direct_count=\app\admin\model\contract\User::where('pid',$uid)->where('real',1)->count();
        $team_count=\app\admin\model\contract\User::where("FIND_IN_SET(".$uid.",team)")->where('real',1)->count();
        foreach ($list as $ks=>$vs){
            $user = \app\admin\model\contract\User::getUserInfo($vs->uid);
            $list[$ks]["address"] = $user->address;
            $list[$ks]["zhiValid"]=\app\admin\model\contract\User::where('pid',$user->uid)->where('real',1)->count();
            $list[$ks]["teamValid"]=\app\admin\model\contract\User::where("FIND_IN_SET(".$user->uid.",team)")->where('real',1)->count();
//            $list[$ks]["user_pledge"] = bcadd($user->user_pledge,0);
//            $list[$ks]["team_pledge"] = bcsub($user->team_pledge,$user->user_pledge);
            $list[$ks]["user_count"] = \app\admin\model\contract\User::where("pid",$vs->uid)->count();
            //团队人数
            $list[$ks]["team_count"] = Relation::where("pid",$vs->uid)->count();
        }
        $data = [
            "count"=>count($zhiList),
            "zhiCount"=>count($zhiList),
            "teamCount"=>count($uidList),
            "zhiValid"=>$direct_count,
            "teamValid"=>$team_count,
            "list"=>$list?$list:[]
        ];
        $this->success(__("我的团队"),$data);
    }

    //奖励页面数据
    public function rewardIndex(){
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $total_reward=Money::where('user_id',$user['uid'])->where('type',Money::REWARD_GIVE)->sum('num');
        $max_id=Money::where('user_id',$user['uid'])->where('type',Money::REWARD_GIVE)->max('admin');
        $rule=Rule::where('id','gt',$max_id)->limit(2)->order('id asc')->select();
        $direct_count=\app\admin\model\contract\User::where('pid',$this->auth->id)->where('real',1)->count();
        $team_count=\app\admin\model\contract\User::where("FIND_IN_SET(".$this->auth->id.",team)")->where('real',1)->count();
        $data=[
            'amount'=>$user['amount'],
            'total_reward'=>$total_reward,
            'rule'=>$rule,
            'direct_count'=>$direct_count,
            'team_count'=>$team_count
        ];
        $this->success(__("奖励页面"),$data);
    }

    // SOCE奖励页面数据
    public function soceRewardIndex(){
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $reward_type = 1;
        $rule = Socerule::order('id asc')->select();
        $direct_count = \app\admin\model\contract\User::where('pid', $this->auth->id)->where('real', 1)->count();
        $team_count = \app\admin\model\contract\User::where("FIND_IN_SET(".$this->auth->id.",team)")->where('real', 1)->count();
        $claimed_ids = Soce::where('user_id', $user['uid'])->where('type', $reward_type)->column('admin');
        $month_count = Soce::where('user_id', $user['uid'])->where('type', $reward_type)->whereTime('create_time', 'month')->count();
        $max_claimed_id = Soce::where('user_id', $user['uid'])->where('type', $reward_type)->max('admin');
        $total_reward = Soce::where('user_id', $user['uid'])->where('type', $reward_type)->sum('num');
        $current_stage_id = 0;
        foreach ($rule as $key => $item) {
            $rule[$key]['claimed'] = in_array($item['id'], $claimed_ids);
            if ($direct_count >= intval($item['direct']) && $team_count >= intval($item['team'])) {
                $current_stage_id = intval($item['id']);
            }
        }
        if ($current_stage_id === 0 && !empty($rule)) {
            $current_stage_id = intval($rule[0]['id']);
        }
        $data = [
            'amount' => empty($user['soce']) ? '0.00000000' : $user['soce'],
            'total_reward' => $total_reward,
            'rule' => $rule,
            'direct_count' => $direct_count,
            'team_count' => $team_count,
            'soce_exchange_status' => intval(Config::get('site.soce_exchange_status')),
            'claimed_ids' => $claimed_ids,
            'month_claimed' => $month_count > 0 ? 1 : 0,
            'max_claimed_id' => empty($max_claimed_id) ? 0 : intval($max_claimed_id),
            'current_stage_id' => $current_stage_id,
            'is_claim_day' => date('j') == 1 ? 1 : 0
        ];
        $this->success(__("SOCE奖励页面"), $data);
    }

    public function soceRewardGive()
    {
        $reward_type = 1;
        $cache = Cache::get("queue-soceRewardGive-" . $this->auth->id);
        if (!empty($cache)) {
            $this->error(__("请稍后重试"));
        }
        Cache::set("queue-soceRewardGive-" . $this->auth->id, 1, 3);
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        if (date('j') != 1) {
            $this->error(__("每月仅1号可领取"));
        }
        $month_count = Soce::where('user_id', $user['uid'])
            ->where('type', $reward_type)
            ->whereTime('create_time', 'month')
            ->count();
        if ($month_count > 0) {
            $this->error(__("本月仅可领取1次"));
        }
        $direct_count = \app\admin\model\contract\User::where('pid', $this->auth->id)->where('real', 1)->count();
        $team_count = \app\admin\model\contract\User::where("FIND_IN_SET(".$this->auth->id.",team)")->where('real', 1)->count();
        $claimed_ids = Soce::where('user_id', $user['uid'])->where('type', $reward_type)->column('admin');

        // 自动选择当前已达成且未领取中，奖励金额最高的一档
        $rules = Socerule::order('reward desc,id desc')->select();
        $rule = null;
        foreach ($rules as $item) {
            if (in_array($item['id'], $claimed_ids)) {
                continue;
            }
            if ($direct_count >= intval($item['direct']) && $team_count >= intval($item['team'])) {
                $rule = $item;
                break;
            }
        }
        if (empty($rule)) {
            $this->error(__("暂不满足领取条件"));
        }
        $coin_price = (string)Config::get('site.coin_price');
        if (bccomp($coin_price, '0', 8) <= 0) {
            $this->error(__("请稍后重试"));
        }
        $soce_num = bcdiv((string)$rule['reward'], $coin_price, 8);
        if (bccomp($soce_num, '0', 8) <= 0) {
            $this->error(__("请稍后重试"));
        }
        $result = Soce::change_money($user['uid'], $soce_num, $reward_type, '领取SOCE奖励', $rule['name'], $rule['id']);
        if (!$result) {
            $this->error(__("请稍后重试"));
        }
        $this->success(__("提取成功"));
    }

    public function soceRewardLog()
    {
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $list = Soce::where('user_id', $user['uid'])
            ->order('id desc')
            ->field('id,num,type,create_time,from,content,admin')
            ->paginate();
        $data = [
            'list' => $list ? $list : [],
            'typesInfo' => Soce::getTypeList()
        ];
        $this->success(__("明细记录"), $data);
    }

    public function soceExchange()
    {
        $cache = Cache::get("user-soceExchange-" . $this->auth->id);
        if (!empty($cache)) {
            $this->error(__("请稍后重试"));
        }
        Cache::set("user-soceExchange-" . $this->auth->id, 1, 3);
        $status = intval(Config::get('site.soce_exchange_status'));
        if ($status !== 1) {
            $this->error(__("暂未开启兑换"));
        }
        $num = trim((string)$this->request->post("num", '0'));
        if ($num === '') {
            $num = '0';
        }
        if (bccomp($num, '0', 8) <= 0) {
            $this->error(__("数量异常"));
        }
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $soce = empty($user['soce']) ? '0.00000000' : (string)$user['soce'];
        if (bccomp($soce, $num, 8) < 0) {
            $this->error(__("SOCE余额不足"));
        }
        Db::startTrans();
        try {
            $soce_result = Soce::change_money($user['uid'], bcmul($num, '-1', 8), Soce::EXCHANGE, 'SOCE兑换OCE', 'SOCE兑换OCE');
            $oce_result = Balance::change_money($user['uid'], $num, Balance::BUY, 'SOCE兑换OCE', 'SOCE兑换OCE');
            if (!$soce_result || !$oce_result) {
                throw new \think\Exception(__("请稍后重试"));
            }
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("兑换成功"));
    }

    public function rewardGive()
    {
        $cache = Cache::get("queue-rewardGive-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("queue-rewardGive-".$this->auth->id,1,3);
        $id = $this->request->post("id");
        $user = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $max_id=Money::where('user_id',$user['uid'])->where('type',Money::REWARD_GIVE)->max('admin');
        $rule=Rule::where('id',$id)->order('id asc')->find();
        if($max_id>$rule['id']){
            $this->error(__("领取信息错误"));
        }
        $direct_count=\app\admin\model\contract\User::where('pid',$this->auth->id)->where('real',1)->count();
        if($rule['direct']>$direct_count){
            $this->error(__("拓朴有效人数不足"));
        }
        $team_count=\app\admin\model\contract\User::where("FIND_IN_SET(".$this->auth->id.",team)")->where('real',1)->count();
        if($rule['team']>$team_count){
            $this->error(__("家族有效人数不足"));
        }
        if($user['amount']<$rule['reward']){
            $this->error(__('奖励余额不足'));
        }
        Db::startTrans();
        try{
            Amount::change_money($user['uid'],-1*$rule['reward'],Amount::REWARD_GIVE,'领取奖励扣除',$rule['name'],$rule['id']);
            Money::change_money($user['uid'],$rule['reward'],Money::REWARD_GIVE,'领取奖励',$rule['name'],$rule['id']);
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("提取成功"));
    }

    /**
     * 基础信息
     */
    public function sell()
    {
        $cache = Cache::get("user-exchange-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("user-exchange-".$this->auth->id,1,10);
        $num = $this->request->post("num",0);
        $price=Config::get('site.coin_price');
        $sell_status=Config::get('site.sell_status');
        $sell_min=Config::get('site.sell_min');
        $sell_max=Config::get('site.sell_max');
        $sell_num=Config::get('site.sell_num');
        if($sell_status!=1){
            $this->error(__("维护中"));
        }
        $count=Balance::where('user_id',$this->auth->id)->where('type',Balance::SELL)->whereTime('create_time','today')->count();
        if($count>=$sell_num&&$sell_num>0){
            $this->error(__('每日最多兑换').$sell_num.__('次'));
        }
        $total=Money::where('user_id',$this->auth->id)->where('type',Money::BUY)->whereTime('create_time','today')->sum('num');
        if(abs($total)+$num>$sell_max&&$sell_max>0){
            $this->error(__('每日最多兑换').$sell_max.'USDT');
        }
        if($num<=0){
            $this->error(__("兑换数量不能小于0"));
        }
        if($num<$sell_min||$num>$sell_max){
            $this->error(sprintf(__("兑换数量请填写%s到%s之间"), $sell_min, $sell_max));
        }
        $usdt_num=bcdiv($num,$price,6);
        $cuser = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $oce_balance = empty($cuser) || $cuser['balance'] === null || $cuser['balance'] === '' ? '0' : (string)$cuser['balance'];
        if (bccomp($oce_balance, $usdt_num, 6) < 0) {
            $this->error(__('OCE余额不足'));
        }
        Db::startTrans();
        try{
            Balance::change_money($this->auth->id,-1*$usdt_num,Balance::SELL,'兑换USDT');
            Money::change_money($this->auth->id,$num,Money::BUY,'兑换USDT');
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("兑换成功"));
    }

    /**
     * 基础信息
     */
    public function buy()
    {
        $cache = Cache::get("user-exchange-buy-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("user-exchange-buy-".$this->auth->id,1,10);
        $num = $this->request->post("num",0);
        $price=Config::get('site.coin_price');
        $sell_status=Config::get('site.buy_status');
        $sell_min=Config::get('site.buy_min');
        $sell_max=Config::get('site.buy_max');
        $sell_num=Config::get('site.buy_num');
        if($sell_status!=1){
            $this->error(__("维护中"));
        }
        $count=Balance::where('user_id',$this->auth->id)->where('type',Balance::BUY)->whereTime('create_time','today')->count();
        if($count>=$sell_num&&$sell_num>0){
            $this->error(__('每日最多兑换').$sell_num.__('次'));
        }
        $total=Money::where('user_id',$this->auth->id)->where('type',Money::SELL)->whereTime('create_time','today')->sum('num');
        if(abs($total)+$num>$sell_max&&$sell_max>0){
            $this->error(__('每日最多兑换').$sell_max.'USDT');
        }
        if($num<=0){
            $this->error(__("兑换数量不能小于0"));
        }
        if($num<$sell_min||$num>$sell_max){
            $this->error(sprintf(__("兑换数量请填写%s到%s之间"), $sell_min, $sell_max));
        }
        $oce_num=bcdiv($num,$price,6);
        $cuser = \app\admin\model\contract\User::getUserInfo($this->auth->id);
        $money_balance = empty($cuser) || $cuser['money'] === null || $cuser['money'] === '' ? '0' : (string)$cuser['money'];
        $num_usdt = (string)$num;
        if (bccomp($money_balance, $num_usdt, 6) < 0) {
            $this->error(__('USDT余额不足'));
        }
        $userMoneyMin = Config::get('site.user_money_min');
        if ($userMoneyMin > 0 && bccomp(bcsub($money_balance, $num_usdt, 6), (string)$userMoneyMin, 6) < 0) {
            $this->error(__('兑换后USDT账户不能少于') . $userMoneyMin);
        }
        Db::startTrans();
        try{
            Balance::change_money($this->auth->id,$oce_num,Balance::BUY,'兑换OCE');
            Money::change_money($this->auth->id,-1*$num,Money::SELL,'兑换OCE');
            Db::commit();
        }catch (\Exception $e){
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(__("兑换成功"));
    }

}
