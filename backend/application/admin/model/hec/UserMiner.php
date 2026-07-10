<?php

namespace app\admin\model\hec;

use think\Model;

class UserMiner extends Model
{
    protected $name = 'user_miner';
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    public function user()
    {
        return $this->belongsTo(\app\common\model\User::class, 'user_id', 'id');
    }

    public function minerType()
    {
        return $this->belongsTo(MinerType::class, 'miner_type_id', 'id');
    }
}
