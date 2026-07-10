<?php

namespace app\admin\controller\contract;

use app\common\controller\Backend;
use Exception;
use think\Db;
use think\exception\PDOException;
use think\exception\ValidateException;

/**
 * 充值订单
 *
 * @icon fa fa-circle-o
 */
class Pay extends Backend
{
    
    /**
     * Pay模型对象
     * @var \app\admin\model\contract\Pay
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\contract\Pay;

    }

    /**
     * 编辑：仅「待付款」(status=1) 时允许修改 hash，其它状态忽略提交的 hash 以防篡改
     */
    public function edit($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds)) {
            if (!in_array($row[$this->dataLimitField], $adminIds)) {
                $this->error(__('You have no permission'));
            }
        }
        if ($this->request->isPost()) {
            $params = $this->request->post("row/a");
            if ($params) {
                $params = $this->preExcludeFields($params);
                if ((int)$row['status'] !== 1) {
                    unset($params['hash']);
                } elseif (array_key_exists('hash', $params) && $params['hash'] !== null) {
                    $params['hash'] = trim($params['hash']);
                    if ($params['hash'] !== '') {
                        $params['hash'] = strtolower($params['hash']);
                        $dup = $this->model->where('id', '<>', (int)$row['id'])
                            ->whereRaw('hash IS NOT NULL AND TRIM(hash) <> \'\' AND LOWER(TRIM(hash)) = :hash', ['hash' => $params['hash']])
                            ->find();
                        if ($dup) {
                            $this->error(__('Hash duplicate'));
                        }
                    }
                }
                $result = false;
                Db::startTrans();
                try {
                    if ($this->modelValidate) {
                        $name = str_replace("\\model\\", "\\validate\\", get_class($this->model));
                        $validate = is_bool($this->modelValidate) ? ($this->modelSceneValidate ? $name . '.edit' : $name) : $this->modelValidate;
                        $row->validateFailException(true)->validate($validate);
                    }
                    $result = $row->allowField(true)->save($params);
                    Db::commit();
                } catch (ValidateException $e) {
                    Db::rollback();
                    $this->error($e->getMessage());
                } catch (PDOException $e) {
                    Db::rollback();
                    $this->error($e->getMessage());
                } catch (Exception $e) {
                    Db::rollback();
                    $this->error($e->getMessage());
                }
                if ($result !== false) {
                    $this->success();
                } else {
                    $this->error(__('No rows were updated'));
                }
            }
            $this->error(__('Parameter %s can not be empty', ''));
        }
        $this->view->assign("row", $row);
        return $this->view->fetch();
    }
}
