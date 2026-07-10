<?php

namespace app\admin\controller\hec;

use app\common\controller\Backend;
use think\Db;
use think\Exception;

/**
 * 用户矿机
 *
 * @icon fa fa-hdd-o
 */
class UserMiner extends Backend
{
    protected $model = null;
    protected $relationSearch = true;
    protected $multiFields = 'status';
    protected $noNeedRight = ['batch_approve', 'batch_reject'];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\UserMiner;
    }

    public function index()
    {
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            if ($this->request->request('keyField')) {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model->with(['user', 'minerType'])->where($where)->order($sort, $order)->count();
            $list = $this->model->with(['user', 'minerType'])->where($where)->order($sort, $order)->limit($offset, $limit)->select();
            foreach ($list as $row) {
                $row->username = $row->user ? $row->user->username : '-';
                $row->miner_type_name = $row->minerType ? $row->minerType->name : $row->miner_type_id;
                $source = trim((string)($row->getData('grant_source') ?: 'user_apply'));
                if ($source !== 'admin_grant') {
                    $source = 'user_apply';
                }
                $row->grant_source = $source;
                $row->grant_source_text = $source === 'admin_grant' ? '后台发放' : '用户申请';
                $row->visible([
                    'id', 'user_id', 'username', 'miner_type_id', 'miner_type_name',
                    'grant_source', 'grant_source_text',
                    'status', 'wallet_address', 'total_mined',
                    'started_at', 'stopped_at', 'expires_at', 'createtime', 'updatetime',
                ]);
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        return $this->view->fetch();
    }

    public function batch_approve($ids = '')
    {
        if (!$this->auth->check('hec/user_miner/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ?: $this->request->param('ids');
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $list = $this->model->where('id', 'in', $ids)->where('status', 'PENDING')->select();
        if (!$list) {
            $this->error('没有待审核的矿机申请');
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
        if (!$this->auth->check('hec/user_miner/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ?: $this->request->param('ids');
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $list = $this->model->where('id', 'in', $ids)->where('status', 'PENDING')->select();
        if (!$list) {
            $this->error('没有待审核的矿机申请');
        }
        $count = 0;
        foreach ($list as $row) {
            $row->status = 'REJECTED';
            $row->stop_reason = 'admin_rejected';
            $row->save();
            $count++;
        }
        $this->success("批量拒绝成功，共 {$count} 条");
    }
}
