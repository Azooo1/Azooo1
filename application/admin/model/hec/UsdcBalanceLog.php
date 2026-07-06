<?php

namespace app\admin\model\hec;

use think\Model;

class UsdcBalanceLog extends Model
{
    protected $name = 'usdc_balance_log';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = false;
}
