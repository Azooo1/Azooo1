<?php

namespace app\common\model;

use think\Model;

class UserMiner extends Model
{
    protected $name = 'user_miner';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    public function minerType()
    {
        return $this->belongsTo(MinerType::class, 'miner_type_id', 'id');
    }
}
