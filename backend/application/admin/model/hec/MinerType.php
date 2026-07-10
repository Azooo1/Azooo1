<?php

namespace app\admin\model\hec;

use think\Model;

class MinerType extends Model
{
    protected $name = 'miner_type';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $pk = 'id';
}
