<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;

/**
 * 矿机类型
 *
 * @icon fa fa-microchip
 */
class MinerType extends Backend
{
    protected $model = null;
    protected $searchFields = 'id,name';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\MinerType;
    }
}
