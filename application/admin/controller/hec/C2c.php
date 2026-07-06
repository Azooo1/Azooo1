<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;
use app\common\library\HecC2c;
use app\common\model\User;
use think\Exception;

/**
 * HEC C2C 订单审核
 *
 * @icon fa fa-handshake-o
 */
class C2c extends Backend
{
    protected $model = null;
    protected $relationSearch = true;
    protected $noNeedRight = ['batch_accept', 'batch_complete', 'batch_cancel', 'random_buyer'];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\HecC2cOrder;
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
            foreach ($list as $row) {
                $row->username = $users[$row->user_id] ?? '-';
                $row->accepted_username = $row->buyer_name ?: '-';
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        return $this->view->fetch();
    }

    public function add()
    {
        $this->error('C2C 订单由用户前台发布，不可手动添加');
    }

    public function del($ids = null)
    {
        $this->error('C2C 订单不可删除');
    }

    public function random_buyer()
    {
        $this->success('', null, ['buyer_name' => HecC2c::randomBuyerName()]);
    }

    public function edit($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        if (false === $this->request->isPost()) {
            $row->username = User::where('id', $row->user_id)->value('username') ?: '-';
            if (!$row->buyer_name && in_array($row->status, ['PENDING', 'ACCEPTED'], true)) {
                $row->buyer_name = HecC2c::randomBuyerName();
            }
            $row->accepted_username = $row->buyer_name ?: '-';
            $this->view->assign('row', $row);
            return $this->view->fetch();
        }

        $params = $this->request->post('row/a');
        if (empty($params)) {
            $this->error(__('Parameter %s can not be empty', ''));
        }

        $newStatus = strtoupper($params['status'] ?? $row->status);
        $reason = trim((string)($params['cancel_reason'] ?? ''));
        $buyerName = trim((string)($params['buyer_name'] ?? ''));

        try {
            if ($newStatus === $row->status) {
                if ($buyerName !== '' && in_array($row->status, ['PENDING', 'ACCEPTED'], true)) {
                    HecC2c::updateBuyerName($row, $buyerName);
                }
            } else {
                HecC2c::adminTransition($row, $newStatus, $this->auth->id, $reason, $buyerName);
            }
        } catch (Exception $e) {
            $this->error($e->getMessage());
        }
        $this->success();
    }

    public function batch_accept($ids = '')
    {
        $this->batchTransition($ids, 'ACCEPTED', 'PENDING', '批量接单');
    }

    public function batch_complete($ids = '')
    {
        $this->batchTransition($ids, 'COMPLETED', ['PENDING', 'ACCEPTED'], '批量完成');
    }

    public function batch_cancel($ids = '')
    {
        $this->batchTransition($ids, 'CANCELLED', ['PENDING', 'ACCEPTED'], '批量取消并退回HEC', '批量取消');
    }

    protected function batchTransition($ids, $newStatus, $fromStatuses, $successLabel, $reason = '')
    {
        if (!$this->auth->check('hec/c2c/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ?: $this->request->param('ids');
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $fromStatuses = (array)$fromStatuses;
        $list = $this->model->where('id', 'in', $ids)->where('status', 'in', $fromStatuses)->select();
        if (!$list) {
            $this->error('没有可操作的订单');
        }
        $count = 0;
        $errors = [];
        foreach ($list as $row) {
            try {
                HecC2c::adminTransition($row, $newStatus, $this->auth->id, $reason, '');
                $count++;
            } catch (Exception $e) {
                $errors[] = '#' . $row->id . ' ' . $e->getMessage();
            }
        }
        if ($count === 0) {
            $this->error($errors ? implode('；', $errors) : '操作失败');
        }
        $msg = "{$successLabel}成功，共 {$count} 条";
        if ($errors) {
            $msg .= '；失败: ' . implode('；', array_slice($errors, 0, 3));
        }
        $this->success($msg);
    }
}
