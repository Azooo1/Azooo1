<?php

namespace app\common\model;

use think\Model;

class HecBalanceLog extends Model
{
    protected $name = 'hec_balance_log';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = false;
}
