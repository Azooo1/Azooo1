<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/24
 * @Time: 17:30
 */

namespace app\common\controller;

use app\admin\model\contract\Level;
use app\admin\model\contract\User;
use app\admin\model\pledge\Order;
use app\admin\model\pledge\OrderLog;
use app\admin\model\pledge\Pledge;
use app\admin\model\user\Amount;
use app\admin\model\Reward;
use app\admin\model\user\Balance;
use think\Config;
use think\Queue;
use think\Controller;

/**
 * 项目公共控制器
 * @package app\common\controller
 */
class SendCoverReward extends Controller
{
    /**
     * 发放质押奖励
     */
    public function SendReward(){
        //获取发放奖励封面
        $rate=Config::get('site.pledge_rate');
        $list=Order::where('send_time','elt',time())
            ->where('status',1)
            ->select();
        foreach ($list as $k =>$v){
            $list[$k]['send_reward']=bcmul($v['price'],$rate/100,6);
        }
        //每人奖励金额
        if(count($list)>0){
            //将投放的用户放入队列
            $queueName = 'SendCoverReward';
            $job = 'app\api\controller\SendCoverReward';
            // 推入消息队列
            foreach($list as $k =>$v){
                Queue::push($job, $v, $queueName);
            }
            return true;
        }else{
            return true;
        }
    }

    /**
     * 发放质押奖励
     */
    public function SendFenHongReward(){
        $day=Config::get('site.node_day');
        $user=User::where('node',1)->where('node_day','lt',$day)->select();
        $reward=Config::get('site.node_num');
        $coin_price=Config::get('site.coin_price');
        $send_reward=bcdiv($reward,$coin_price,6);
        User::where('node',1)->where('node_day','lt',$day)->setInc('node_day',1);
        //每人奖励金额
        if(count($user)>0&&$send_reward>0){
            foreach ($user as $k =>$v){
                Balance::change_money($v['uid'],$send_reward,Balance::NODE_REWARD,'每日节点奖励');
            }
            return true;
        }else{
            return true;
        }
    }
}
