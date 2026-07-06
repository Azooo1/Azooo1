<?php

namespace app\admin\controller\contract;

use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use app\admin\model\user\Point;
use app\admin\model\user\Amount;
use app\admin\model\user\Direct;
use app\admin\model\user\Soce;
use app\common\controller\Backend;
use app\common\library\Token;
use Exception;
use think\Db;
use think\exception\PDOException;
use think\exception\ValidateException;

/**
 * 合约会员
 *
 * @icon fa fa-circle-o
 */
class User extends Backend
{

    /**
     * User模型对象
     * @var \app\admin\model\contract\User
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\contract\User;
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
            if($params['address']!=$row['address']){
                $this->model->where('uid',$row['uid'])->update(['address'=>strtolower($params['address'])]);
                \app\admin\model\User::where('id',$row['uid'])->update([
                    'username'=>strtolower($params['address']),
                    'nickname'=>strtolower($params['address']),
                    'address'=>strtolower($params['address']),
                ]);
                $token=Db::name('user_token')->where('user_id',$row['uid'])->find();
                if($token){
                    Token::delete($token['token']);
                    Db::name('user_token')->where('user_id',$row['uid'])->delete();
                }

            }
            unset($params['address']);
            if($params["money"]<>0) {
                Money::change_money($row['uid'],$params["money"],99,'系统处理','',1);
            }
            if($params["balance"]<>0) {
                Balance::change_money($row['uid'],$params["balance"],99,'系统处理','',1);
            }
            if(isset($params["soce"]) && bccomp((string)$params["soce"], '0', 8) != 0) {
                Soce::change_money($row['uid'],$params["soce"],99,'系统处理','',1);
            }
            if($params["point"]<>0) {
                Point::change_money($row['uid'],$params["point"],99,'系统处理','',1);
            }
            if($params["amount"]<>0) {
                Amount::change_money($row['uid'],$params["amount"],99,'系统处理','',1);
            }
            if($params["direct"]<>0) {
                Direct::change_money($row['uid'],$params["direct"],99,'系统处理','',1);
            }
            unset($params['money']);
            unset($params['balance']);
            unset($params['soce']);
            unset($params['point']);
            unset($params['amount']);
            unset($params['direct']);
            if($params["node"]==1) {
                $params['real']=1;
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
        if (false === $result) {
            $this->error(__('No rows were updated'));
        }
        $this->success();
    }
}
