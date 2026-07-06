<?php

namespace app\admin\model\contract;

use think\Exception;
use think\Model;


class Feedback extends Model
{





    // 表名
    protected $name = 'contract_feedback';

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
     * 意见反馈
     */
    public static function addInfo($uid,$data)
    {
        $user = User::getUserInfo($uid);
        if(empty($user)){
            throw new Exception(__("用户信息获取失败"));
        }
        if(empty($data["info"])){
            throw new Exception(__("请输入反馈内容"));
        }
        $model = new self();
        $model->uid = $uid;
        $model->address = $user->address;
        $model->info = $data["info"];
        $model->thumbs = $data["thumbs"];
        $model->status = 1;
        $model->save();
        return true;
    }




}
