<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/24
 * @Time: 17:30
 */

namespace app\common\controller;

use app\admin\model\pledge\Order;
use app\admin\model\pledge\Pledge;
use think\Queue;
use think\Controller;

/**
 * 项目公共控制器
 * @package app\common\controller
 */
class SendFenHongReward extends Controller
{
    /**
     * 发放质押奖励
     */
    public function SendReward(){
        $cover=Pledge::column('rate','id');
        //获取发放奖励封面
        $list=Order::where('send_time','elt',time())
            ->where('status',1)
            ->select();
        foreach ($list as $k =>$item){
            $rate=$cover[$item['pid']];
            $list[$k]['send_reward']=bcmul($item['price'],$rate/100,6);
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
}
