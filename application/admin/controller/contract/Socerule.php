<?php

namespace app\admin\controller\contract;

use app\common\controller\Backend;

/**
 * SOCE奖励规则
 *
 * @icon fa fa-circle-o
 */
class Socerule extends Backend
{

    /**
     * @var \app\admin\model\contract\Socerule
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\contract\Socerule;
    }
}
