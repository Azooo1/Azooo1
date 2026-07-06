<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/25
 * @Time: 9:50
 */
namespace app\api\controller;


use app\admin\model\contract\Level;
use app\admin\model\contract\User;
use app\admin\model\pledge\Order;
use app\admin\model\pledge\OrderLog;
use app\admin\model\pledge\Pledge;
use app\admin\model\user\Amount;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use think\Config;
use think\Db;
use think\queue\Job;

class SendCoverReward
{
    // 消费者执行入口
    public function fire(Job $job, $data)
    {
        // 具体执行业务
        $isJobDone = $this->doJob($data);
        if ($isJobDone) {
            // 消息队列执行成功，删除队列，否则会一直执行
            $job->delete();
        } else {
            // 获取消息队列已经重试了几遍
            $attempts = $job->attempts();
            if ($attempts > 1 && $attempts < 3) {
                // 重新发布，参数 delay 是延时发布的时间
                $job->release(2);
            }else{
                //处理掉失败3次的任务，并做记录
                $job->failed($data);
            }
        }
    }

    // 消息队列执行失败后会自动执行该方法
    public function failed($data)
    {
        return false;
    }

    // 消息队列执行方法
    public function doJob($data)
    {
        //获取用户团队信息
        $user=User::where('uid',$data['uid'])->find();
        $reward=$data['send_reward'];
        $pledge_usdt=Config::get('site.pledge_usdt');
        $pledge_oce=100-Config::get('site.pledge_usdt');
        $coin_price=Config::get('site.coin_price');
        $usdt_reward=0;
        $oce_reward=0;
        if($pledge_usdt>0){
            $usdt_reward=bcmul($reward,$pledge_usdt/100,6);
        }
        if($pledge_oce>0){
            $oce_reward=bcmul($reward,$pledge_oce/100/$coin_price,6);
        }
        $pledge_rule1=Config::get('site.pledge_rule1');
        $pledge_rule2=Config::get('site.pledge_rule2');
        $pledge_rule3=Config::get('site.pledge_rule3');
        $p1_reward=0;
        $p2_reward=0;
        $p3_reward=0;
        $p1_uid=0;
        $p2_uid=0;
        $p3_uid=0;
        if($pledge_rule1>0){
            $p1_reward=bcmul($reward,$pledge_rule1/100,6);
            $p1_user=User::wherein('uid',$user['team'])->where('line',$user['line']-1)->find();
            if($p1_user){
                if(User::where('pid',$p1_user['uid'])->where('real',1)->count()>0){
                    $p1_uid=$p1_user['uid'];
                }
            }
        }
        if($pledge_rule2>0){
            $p2_reward=bcmul($reward,$pledge_rule2/100,6);
            $p2_user=User::wherein('uid',$user['team'])->where('line',$user['line']-2)->find();
            if($p2_user){
                if(User::where('pid',$p2_user['uid'])->where('real',1)->count()>1){
                    $p2_uid=$p2_user['uid'];
                }
            }
        }
        if($pledge_rule3>0){
            $p3_reward=bcmul($reward,$pledge_rule3/100,6);
            $p3_user=User::wherein('uid',$user['team'])->where('line',$user['line']-3)->find();
            if($p3_user){
                if(User::where('pid',$p3_user['uid'])->where('real',1)->count()>2){
                    $p3_uid=$p3_user['uid'];
                }
            }
        }
        Db::startTrans();
        try {
            Order::where('id',$data['id'])->update(['status'=>3,'end_time'=>time(),'back_time'=>time(),'money'=>$usdt_reward,'balance'=>$oce_reward]);
            if($usdt_reward>0){
                Money::change_money($data['uid'],$usdt_reward,Money::PLEDGE_REWARD,'质押收益',$data['ordersn']);
            }
            if($oce_reward>0){
                Balance::change_money($data['uid'],$oce_reward,Balance::PLEDGE_REWARD,'质押收益',$data['ordersn']);
            }
            Money::change_money($data['uid'],$data['price'],Money::PLEDGE_BACK,'解押返还本金',$data['ordersn']);
            if($p1_uid>0&&$p1_reward>0){
                Amount::change_money($p1_uid,$p1_reward,Amount::REWARD_ONE,'一代奖励',$data['ordersn']);
            }
            if($p2_uid>0&&$p2_reward>0){
                Amount::change_money($p2_uid,$p2_reward,Amount::REWARD_TWO,'二代奖励',$data['ordersn']);
            }
            if($p3_uid>0&&$p3_reward>0){
                Amount::change_money($p3_uid,$p3_reward,Amount::REWARD_THR,'三代奖励',$data['ordersn']);
            }
            // 提交事务
            Db::commit();
            $result=true;
        } catch (\Exception $e) {
            dump($e->getMessage());
            // 回滚事务
            Db::rollback();
            $result=false;
        }
        return $result;
    }
}
