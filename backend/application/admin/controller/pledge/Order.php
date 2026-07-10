<?php

namespace app\admin\controller\pledge;

use app\common\controller\Backend;

/**
 * 卡牌订单
 *
 * @icon fa fa-circle-o
 */
class Order extends Backend
{
    protected $noNeedRight = ["upload"];
    /**
     * Order模型对象
     * @var \app\admin\model\pledge\Order
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\pledge\Order;
    }

    /**
     * 添加
     */
    public function add()
    {
        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds) && !in_array($row[$this->dataLimitField], $adminIds)) {
            $this->error(__('You have no permission'));
        }
        if (false === $this->request->isPost()) {
            $list = \app\admin\model\pledge\Pledge::order("id asc")
            ->select();
            $newlist=array();
            foreach ($list as $k =>$v){
                $newlist[$v['id']]=$v['day'].'天';
            }
            $this->view->assign('list', $newlist);
            return $this->view->fetch();
        }
        $params = $this->request->post('row/a');
        if (empty($params)) {
            $this->error(__('Parameter %s can not be empty', ''));
        }
        $params = $this->preExcludeFields($params);
        try {
            // 调用抛异常的方法
            \app\admin\model\pledge\Order::createOrderAdmin($params['uid'],$params['pid'],$params['num']);
            // 后续正常业务逻辑（查询用户、渲染页面等）
        } catch (\Exception $e) {
            $this->error($e->getMessage());
        }
        $this->success();
    }
}
