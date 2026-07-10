<?php

namespace app\admin\model\hec;

use think\Model;

class HecC2cOrder extends Model
{
    protected $name = 'hec_c2c_order';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
}
