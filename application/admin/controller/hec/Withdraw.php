<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;
use app\common\library\HecBalanceLedger;
use app\common\model\User;
use think\Db;
use think\Exception;

/**
 * HEC 提币审核
 *
 * @icon fa fa-money
 */
class Withdraw extends Backend
{
    protected $model = null;
    protected $relationSearch = true;
    protected $multiFields = 'status';
    protected $noNeedRight = ['batch_approve', 'batch_reject'];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\HecWithdraw;
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
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        return $this->view->fetch();
    }

    public function add()
    {
        $this->error('提币记录由用户前台申请，不可手动添加');
    }

    public function del($ids = null)
    {
        $this->error('提币记录不可删除');
    }

    public function edit($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        if (false === $this->request->isPost()) {
            $row->username = User::where('id', $row->user_id)->value('username') ?: '-';
            $this->view->assign('row', $row);
            return $this->view->fetch();
        }
        $params = $this->request->post('row/a');
        if (empty($params)) {
            $this->error(__('Parameter %s can not be empty', ''));
        }
        $newStatus = $params['status'] ?? $row->status;
        $oldStatus = $row->status;
        Db::startTrans();
        try {
            if ($newStatus === 'REJECTED' && $oldStatus === 'PENDING') {
                $this->refundUser($row);
            }
            $row->status = $newStatus;
            $row->review_note = $params['review_note'] ?? $row->review_note;
            $row->save();
            Db::commit();
        } catch (Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success();
    }

    public function batch_approve($ids = '')
    {
        if (!$this->auth->check('hec/withdraw/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ?: $this->request->param('ids');
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $list = $this->model->where('id', 'in', $ids)->where('status', 'PENDING')->select();
        if (!$list) {
            $this->error('没有待审核的提币记录');
        }
        $count = 0;
        foreach ($list as $row) {
            $row->status = 'APPROVED';
            $row->save();
            $count++;
        }
        $this->success("批量通过成功，共 {$count} 条");
    }

    public function batch_reject($ids = '')
    {
        if (!$this->auth->check('hec/withdraw/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ?: $this->request->param('ids');
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $list = $this->model->where('id', 'in', $ids)->where('status', 'PENDING')->select();
        if (!$list) {
            $this->error('没有待审核的提币记录');
        }
        $count = 0;
        Db::startTrans();
        try {
            foreach ($list as $row) {
                $this->refundUser($row);
                $row->status = 'REJECTED';
                $row->review_note = '批量拒绝';
                $row->save();
                $count++;
            }
            Db::commit();
        } catch (Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success("批量拒绝成功，共 {$count} 条");
    }

    protected function refundUser($row)
    {
        $user = User::lock(true)->find($row->user_id);
        if (!$user) {
            throw new Exception('用户不存在');
        }
        $refund = $row->deduct_amount > 0 ? $row->deduct_amount : $row->amount;
        $currency = strtoupper((string)$row->currency);
        if ($currency === 'USDC') {
            $currency = 'USDT';
        }
        $field = $currency === 'USDT' ? 'usdt_balance' : 'mac_balance';
        $before = $user->$field;
        $user->$field = bcadd($user->$field, $refund, 8);
        $user->save();
        if ($currency === 'MAC') {
            HecBalanceLedger::logHec(
                $user->id,
                'WITHDRAW_REFUND',
                (string)$refund,
                $before,
                $user->mac_balance,
                '提币拒绝退回',
                $row->id,
                'hec_withdraw'
            );
        } elseif ($currency === 'USDT') {
            HecBalanceLedger::logUsdc(
                $user->id,
                'WITHDRAW_REFUND',
                (string)$refund,
                $before,
                $user->usdt_balance,
                '提币拒绝退回',
                $row->id,
                'hec_withdraw'
            );
        }
    }
}
