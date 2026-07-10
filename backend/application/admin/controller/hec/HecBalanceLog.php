<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;
use app\common\library\HecBalanceLedger;
use app\common\model\User;

/**
 * HEC 余额流水
 *
 * @icon fa fa-list-alt
 */
class HecBalanceLog extends Backend
{
    protected $model = null;
    protected $relationSearch = true;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\HecBalanceLog;
    }

    public function index()
    {
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model->where($where)->order($sort, $order)->count();
            $list = $this->model->where($where)->order($sort, $order)->limit($offset, $limit)->select();
            $userIds = array_unique(array_column(collection($list)->toArray(), 'user_id'));
            $users = $userIds ? User::where('id', 'in', $userIds)->column('username', 'id') : [];
            $typeList = HecBalanceLedger::hecTypeList();
            foreach ($list as $row) {
                $row->username = $users[$row->user_id] ?? '-';
                $row->change_type_text = $typeList[$row->change_type] ?? $row->change_type;
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        $this->view->assign('changeTypeList', HecBalanceLedger::hecTypeList());
        return $this->view->fetch();
    }

    public function add()
    {
        $this->error('流水由系统自动记录，不可手动添加');
    }

    public function edit($ids = null)
    {
        $this->error('流水不可编辑');
    }

    public function del($ids = null)
    {
        $this->error('流水不可删除');
    }
}
