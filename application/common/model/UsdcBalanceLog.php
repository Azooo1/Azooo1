<?php

namespace app\common\model;

use think\Model;

class UsdcBalanceLog extends Model
{
    protected $name = 'usdc_balance_log';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = false;
}
