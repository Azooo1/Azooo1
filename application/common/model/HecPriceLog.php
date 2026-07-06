<?php

namespace app\common\model;

use think\Model;

class HecPriceLog extends Model
{
    protected $name = 'hec_price_log';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = false;
}
