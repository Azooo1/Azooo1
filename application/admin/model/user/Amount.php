<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/21
 * @Time: 16:43
 */
namespace app\admin\model\user;

use app\admin\model\contract\User;
use think\Model as ThinkModel;
use think\Db;

class Amount extends ThinkModel
{
    // 表名
    protected $name = 'user_amount';
    protected $pk = 'id';

    const   REWARD_GIVE=1;//奖励领取
    const   REWARD_ONE=2;//梯度奖励
    const   REWARD_TWO=3;//梯度奖励
    const   REWARD_THR=4;//梯度奖励
    const   SYSTEM=99;

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type=1,$value=1){
        $data= [
            self::REWARD_GIVE=>__('奖励领取'),
            self::REWARD_ONE=>__('梯度奖励'),
            self::REWARD_TWO=>__('梯度奖励'),
            self::REWARD_THR=>__('梯度奖励'),
            self::SYSTEM=>__('系统管理'),
        ];
        if($type==1){
            return $data;
        }else{
            return $data[$value];
        }
    }

    /*
     * 账户余额变动
     */
    static public function change_money($user_id,$num,$type,$cont,$from='',$admin=0){
        $user=User::where('uid',$user_id)->find();
        $before=$user['amount'];
        $after=$before+$num;
        $log=[
            'user_id'=>$user_id,
            'before'=>$before,
            'after'=>$after,
            'num'=>$num,
            'type'=>$type,
            'content'=>$cont,
            'create_time'=>time(),
            'from'=>$from,
            'admin'=>$admin
        ];
        //插入订单表
        Db::startTrans();
        try {
            self::insert($log);
            User::where('uid',$user_id)->setInc('amount',$num);
            // 提交事务
            Db::commit();
            $result=true;
        } catch (\Exception $e) {
            // 回滚事务
            dump($e->getMessage());
            Db::rollback();
            $result=false;
        }
        return $result;
    }

}
