<?php

namespace app\admin\controller\contract;

use app\common\controller\Backend;

/**
 * SOCE账户记录
 *
 * @icon fa fa-circle-o
 */
class Soce extends Backend
{

    /**
     * @var \app\admin\model\user\Soce
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\user\Soce;
    }

    public function gettype()
    {
        $nft = $this->model::getTypeList();
        return json($nft);
    }
}
