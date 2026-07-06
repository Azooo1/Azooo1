<?php

namespace app\admin\model\hec;

use think\Model;

class UsdcApprove extends Model
{
    protected $name = 'usdc_approve';
    protected $strict = false;
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
}
