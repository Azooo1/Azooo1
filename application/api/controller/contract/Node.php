<?php

namespace app\api\controller\contract;

use app\common\controller\Api;
use think\Cache;
use think\Config;

/**
 * 节点购买
 */
class Node extends Api
{
    /**
     * 节点购买
     */
    public function create()
    {
        $cache = Cache::get("node-create-".$this->auth->id);
        if(!empty($cache)){
            $this->error(__("请稍后重试"));
        }
        Cache::set("node-create-".$this->auth->id,1,3);
        try{
            $data = \app\admin\model\contract\Node::createOrder($this->auth->id);
        }catch (\Exception $e){
            $this->error($e->getMessage());
        }
        $this->success(__("购买成功"),$data);
    }
}
