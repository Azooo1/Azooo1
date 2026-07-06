<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;

/**
 * HEC 价格日志
 *
 * @icon fa fa-line-chart
 */
class PriceLog extends Backend
{
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\HecPriceLog;
    }
}
