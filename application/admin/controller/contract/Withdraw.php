<?php

namespace app\admin\controller\contract;

use app\common\controller\Backend;
use think\Db;
use think\exception\DbException;
use think\exception\PDOException;
use think\exception\ValidateException;
use app\admin\model\user\Money;
use app\admin\model\user\Balance;
use app\admin\model\user\Point;
use app\admin\model\user\Direct;
use think\Exception;

/**
 * 提现记录
 *
 * @icon fa fa-circle-o
 */
class Withdraw extends Backend
{

    /**
     * Withdraw模型对象
     * @var \app\admin\model\contract\Withdraw
     */
    protected $model = null;

    /**
     * 批量操作允许的字段
     */
    protected $multiFields = 'status';

    /**
     * 批量通过、批量拒绝使用 edit 权限校验，无需单独配置规则
     */
    protected $noNeedRight = ['batch_approve', 'batch_reject'];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\contract\Withdraw;

    }

    /**
     * 默认生成的控制器所继承的父类中有index/add/edit/del/multi五个基础方法、destroy/restore/recyclebin三个回收站方法
     * 因此在当前控制器中可不用编写增删改查的代码,除非需要自己控制这部分逻辑
     * 需要将application/admin/library/traits/Backend.php中对应的方法复制到当前控制器,然后进行修改
     */
    /**
     * 编辑
     *
     * @param $ids
     * @return string
     * @throws DbException
     * @throws \think\Exception
     */
    public function edit($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds) && !in_array($row[$this->dataLimitField], $adminIds)) {
            $this->error(__('You have no permission'));
        }
        if (false === $this->request->isPost()) {
            $this->view->assign('row', $row);
            return $this->view->fetch();
        }
        $params = $this->request->post('row/a');
        if (empty($params)) {
            $this->error(__('Parameter %s can not be empty', ''));
        }
        $params = $this->preExcludeFields($params);
        $result = false;
        Db::startTrans();
        try {
            //是否采用模型验证
            if ($this->modelValidate) {
                $name = str_replace("\\model\\", "\\validate\\", get_class($this->model));
                $validate = is_bool($this->modelValidate) ? ($this->modelSceneValidate ? $name . '.edit' : $name) : $this->modelValidate;
                $row->validateFailException()->validate($validate);
            }
            if($params['status']==9){
                if($row->credittype==1){
                    Money::change_money($row->uid,$row->price,Money::CASH_BACK,'提现驳回',$row->id);
                    if($row->oce>0){
                        Balance::change_money($row->uid,$row->oce,Balance::CASH_BACK,'提现退回',$row->id);
                    }
                    if($row->point>0){
                        Point::change_money($row->uid,$row->point,Point::CASH_BACK,'提现退回',$row->id);
                    }
                    if($row->direct>0){
                        Direct::change_money($row->uid,$row->direct,Direct::CASH_BACK,'提现退回',$row->id);
                    }
                }
            }
            $result = $row->allowField(true)->save($params);
            Db::commit();
        } catch (ValidateException|PDOException|Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        if (false === $result) {
            $this->error(__('No rows were updated'));
        }
        $this->success();
    }

    /**
     * 批量通过
     */
    public function batch_approve($ids = "")
    {
        if (!$this->auth->check('contract/withdraw/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ? $ids : $this->request->param("ids");
        if (empty($ids)) {
            $this->error(__('Parameter %s can not be empty', 'ids'));
        }
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds)) {
            $this->model->where($this->dataLimitField, 'in', $adminIds);
        }
        $list = $this->model->where('id', 'in', $ids)->where('status', 1)->select();
        if (empty($list)) {
            $this->error(__('没有待审核的提现记录'));
        }
        $count = 0;
        Db::startTrans();
        try {
            foreach ($list as $row) {
                $row->status = 3;
                $row->save();
                $count++;
            }
            Db::commit();
        } catch (Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(sprintf(__('批量通过成功，共处理 %d 条'), $count));
    }

    /**
     * 批量拒绝
     */
    public function batch_reject($ids = "")
    {
        if (!$this->auth->check('contract/withdraw/edit')) {
            $this->error(__('You have no permission'));
        }
        $ids = $ids ? $ids : $this->request->param("ids");
        if (empty($ids)) {
            $this->error(__('Parameter %s can not be empty', 'ids'));
        }
        $ids = is_array($ids) ? $ids : explode(',', $ids);
        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds)) {
            $this->model->where($this->dataLimitField, 'in', $adminIds);
        }
        $list = $this->model->where('id', 'in', $ids)->where('status', 1)->select();
        if (empty($list)) {
            $this->error(__('没有待审核的提现记录'));
        }
        $count = 0;
        Db::startTrans();
        try {
            foreach ($list as $row) {
                if ($row->credittype == 1 || $row->credittype == 'credit1') {
                    Money::change_money($row->uid, $row->price, Money::CASH_BACK, '提现驳回', $row->id);
                    if ($row->oce > 0) {
                        Balance::change_money($row->uid, $row->oce, Balance::CASH_BACK, '提现退回', $row->id);
                    }
                    if ($row->point > 0) {
                        Point::change_money($row->uid, $row->point, Point::CASH_BACK, '提现退回', $row->id);
                    }
                    if ($row->direct > 0) {
                        Direct::change_money($row->uid, $row->direct, Direct::CASH_BACK, '提现退回', $row->id);
                    }
                }
                $row->status = 9;
                $row->save();
                $count++;
            }
            Db::commit();
        } catch (Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success(sprintf(__('批量拒绝成功，共处理 %d 条'), $count));
    }

}
