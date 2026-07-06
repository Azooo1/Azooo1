<?php

namespace app\common\model;

use think\Model;

class MinerType extends Model
{
    protected $name = 'miner_type';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
}
