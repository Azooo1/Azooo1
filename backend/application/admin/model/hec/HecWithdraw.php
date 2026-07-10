<?php

namespace app\admin\model\hec;

use think\Model;

class HecWithdraw extends Model
{
    protected $name = 'hec_withdraw';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
}
