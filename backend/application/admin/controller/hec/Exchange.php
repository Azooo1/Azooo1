<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;

/**
 * HEC 闪兑记录
 *
 * @icon fa fa-exchange
 */
class Exchange extends Backend
{
    protected $model = null;
    protected $relationSearch = true;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\HecExchange;
    }

    public function index()
    {
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model->where($where)->order($sort, $order)->count();
            $list = $this->model->where($where)->order($sort, $order)->limit($offset, $limit)->select();
            $userIds = array_unique(array_column(collection($list)->toArray(), 'user_id'));
            $users = $userIds ? \app\common\model\User::where('id', 'in', $userIds)->column('username', 'id') : [];
            foreach ($list as $row) {
                $row->username = $users[$row->user_id] ?? '-';
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        return $this->view->fetch();
    }

    public function add()
    {
        $this->error('闪兑记录由用户前台产生，不可手动添加');
    }

    public function del($ids = null)
    {
        $this->error('闪兑记录不可删除');
    }
}
