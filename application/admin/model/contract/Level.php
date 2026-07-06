<?php

namespace app\admin\model\contract;

use think\Cache;
use think\Config;
use think\Model;
use app\admin\model\Reward;
use app\admin\model\user\Amount;


class Level extends Model
{





    // 表名
    protected $name = 'contract_level';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'integer';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = false;

    // 追加属性
    protected $append = [

    ];

    public static function check_level($uid){
        //获取用户的信息
        $user=User::where('uid',$uid)->find();
        $next_level=self::where('id',$user['level']+1)->find();
        if(!$next_level){
            return true;
        }else{
            $pledge_total=User::where('find_in_set('.$uid.',team)')
                ->where('line','elt',$user['line']+$next_level['line'])
                ->sum('user_pledge');
            //判断业绩是否达标
            if($next_level['pledge_num']>$pledge_total){
                return true;
            }
            if($next_level['level_num']>0 && $next_level['level'] > 0){
                $team_count=self::getLevelLine($uid,$user['level'],$user['line']+$next_level['line']);
                if($team_count<$next_level['level_num']){
                    return true;
                }
            }
            User::where('uid',$uid)->update(['level'=>$next_level['id']]);
            $reward=Reward::get(1);
            if($next_level['id'] >= 6&&$reward['reward1']>0){
                Amount::change_money($uid,$reward['reward1'],Amount::FENHONG,'V5等级首位达标，累计奖励发放');
            }
            if($next_level['id'] >= 7&&$reward['reward2']>0){
                 Amount::change_money($uid,$reward['reward2'],Amount::FENHONG,'V6等级首位达标，累计奖励发放');
            }
            if($next_level['id'] >= 8&&$reward['reward3']>0){
                 Amount::change_money($uid,$reward['reward3'],Amount::FENHONG,'V7等级首位达标，累计奖励发放');
            }
            if($next_level['id']==8){
                self::checkSxfNum($uid);
                if(!empty($user['team'])){
                    $team=explode(',',$user['team']);
                    foreach ($team as $k =>$v){
                        self::checkSxfNum($v);
                    }
                }
            }
        }
    }

    /**
     * 获取符合要求的线数
     */
    public static function getLevelLine($uid,$level,$max_line=1){
        $count=0;
        $list=User::where('pid',$uid)->select();
        foreach ($list as $k =>$v){
            if($v['level']>=$level){
                $count=$count+1;
            }else{
                $dabiao=User::where('find_in_set('.$v['uid'].',team)')
                    ->where('level',$level)
                    ->where('line','elt',$max_line)
                    ->count();
                if($dabiao>0){
                    $count=$count+1;
                }
            }
        }
        return $count;
    }

    /**
     * 升级、降级V7用户，更新用户及上级V7奖励份数
     * $type 1 升级 2 降级
     */
    public static function checkSxfNum($uid,$type=1){
        if($type==1){
            $count=User::where("FIND_IN_SET(".$uid.",team)")
                ->where('level',8)
                ->count();
            User::where('uid',$uid)->update(['sxf_num'=>$count+1]);
        }else{
            User::where('uid',$uid)->update(['sxf_num'=>0]);
        }


    }

}
