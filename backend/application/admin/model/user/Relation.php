<?php

namespace app\admin\model\user;

use think\Model;


class Relation extends Model
{





    // 表名
    protected $name = 'user_relation';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = false;

    // 定义时间戳字段名
    protected $createTime = false;
    protected $updateTime = false;
    protected $deleteTime = false;

    // 追加属性
    protected $append = [

    ];



    /**
     * 添加团队记录
     */
    public static function addRelation($uid,$relation)
    {
        $relation = explode("-",$relation);
        $level = 1;
        $key1 = 1;
        foreach ($relation as $k=>$v){
            if ($v === ''){
                continue;
            }
            $arr[$key1]['uid'] = $uid;
            $arr[$key1]['pid'] = $v;
            $arr[$key1]['level'] = $level;
            $level++;
            $key1++;
        }
        $model = new self();
        $model->insertAll($arr);
    }
    /**
     * 更新团队记录
     */
    public static function saveRelation($uid,$relation)
    {
        $model = new self();
        $list = $model->where('uid', $uid)->select();
        foreach ($list as $k=>$v){
            $v->delete();
        }
        $relation = explode("-",$relation);
        $level = 1;
        $key1 = 1;
        foreach ($relation as $k=>$v){
            if ($v === ''){
                continue;
            }
            $arr[$key1]['uid'] = $uid;
            $arr[$key1]['pid'] = $v;
            $arr[$key1]['level'] = $level;
            $level++;
            $key1++;
        }
        $model = new self();
        $model->insertAll($arr);
    }






}
