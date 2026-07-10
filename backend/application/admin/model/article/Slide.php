<?php

namespace app\admin\model\article;

use think\Model;


class Slide extends Model
{





    // 表名
    protected $name = 'slide_list';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = false;

    // 追加属性
    protected $append = [

    ];



    public static function getTypeLevel()
    {
        return [
            1=>"幻灯",
            2=>"幻灯2",
            3=>"大图",
            4=>"抢购"
        ];
    }


    public static function getLangInfo()
    {
        return [
            'zh-cn'=>"中文",
            'en'=>"英文"
        ];
    }




}
