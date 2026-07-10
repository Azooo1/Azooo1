<?php

namespace app\admin\model\pledge;

use think\Model;
use app\admin\model\user\Amount;


class OrderLog extends Model
{





    // 表名
    protected $name = 'pledge_log';


    // 追加属性
    protected $append = [
    ];

    // const   TIQU=1;//每日收益
    const   SXF=2;//手续费
    const   DAY=13;//静态释放
    const   LEVEL=14;//团队加速
    const   BACK=15;//返还本金
    const   PLAT=16;//平级加速

    /* *
     * 获取类型列表
     * */
    static public function getTypeList($type=1,$value=1){
        $data= [
            // self::TIQU=>'提取收益',
            self::SXF=>'手续费',
            self::DAY=>'静态释放',
            self::LEVEL=>'团队加速',
            self::BACK=>'返还本金',
            self::PLAT=>'平级加速',
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
    static public function change_money($user_id,$num,$type,$content,$oid,$from=''){
        $order=Order::where('id',$oid)->find();
        if($type!=2){
            $before=$order['total_reward'];
            $after=$before+$num;
        }else{
            $before=0;
            $after=0;
        }
        $log=[
            'user_id'=>$user_id,
            'oid'=>$oid,
            'before'=>$before,
            'after'=>$after,
            'num'=>$num,
            'type'=>$type,
            'content'=>$content,
            'create_time'=>time(),
            'from'=>$from
        ];
        self::insert($log);
        if($type!=2){
            Order::where('id',$oid)->setInc('total_reward',$num);
        }
        if($type==13||$type==14||$type==16||$type==15){
            Order::where('id',$oid)->setDec('surplus',$num);
            Amount::change_money($user_id,$num,$type,$content,$from);
        }
        if($type==13){
            Order::where('id',$oid)->setInc('jt_surplus',$num);
        }
        if($type==14||$type==16){
            Order::where('id',$oid)->setInc('dt_surplus',$num);
        }

    }
}
