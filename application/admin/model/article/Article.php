<?php

namespace app\admin\model\article;

use think\Model;


class Article extends Model
{





    // 表名
    protected $name = 'article_list';

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
            1=>"公告",
        ];
    }

    public static function getLangInfo()
    {
        return [
            1=>"中文",
            2=>"英文"
        ];
    }






}
