<?php

namespace app\admin\controller\pledge;

use app\common\controller\Backend;

/**
 * 卡牌套餐
 *
 * @icon fa fa-circle-o
 */
class Pledge extends Backend
{

    /**
     * Package模型对象
     * @var \app\admin\model\pledge\Pledge
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\pledge\Pledge;
    }

    public function getcate(){
        $list=\app\admin\model\pledge\Pledge::column('day','id');
        foreach ($list as $k =>$v){
            $list[$k]=$v.'天';
        }
        return json($list);
    }
}
