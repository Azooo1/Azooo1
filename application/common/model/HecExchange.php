<?php

namespace app\common\model;

use think\Model;

class HecExchange extends Model
{
    protected $name = 'hec_exchange';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = false;
}
