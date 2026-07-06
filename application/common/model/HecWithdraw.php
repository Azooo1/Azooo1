<?php

namespace app\common\model;

use think\Model;

class HecWithdraw extends Model
{
    protected $name = 'hec_withdraw';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
}
