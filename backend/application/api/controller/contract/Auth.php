<?php

namespace app\api\controller\contract;

use app\common\controller\Api;
use app\common\library\Hash;
use think\Config;

/**
 * 登录注册
 */
class Auth extends Api
{
    // 无需登录的接口,*表示全部
    protected $noNeedLogin = '*';

    public function _initialize()
    {
        parent::_initialize();
    }

    public function login()
    {
        $address = $this->request->post("address");
        if (!$address || strlen($address) < 40) {
            $this->error(__('参数异常'));
        }
        $signature = $this->request->post('sign');
        $msg_nonce = $this->request->post('msg_nonce');
        $msg_nonce_arr = explode(',',$msg_nonce);
        $nonce_arr = explode(':',$msg_nonce_arr[1]);
        $nonce = $nonce_arr[1];//用户登录随机数标识
        if (!$address || !$signature) {
            $this->error(__('参数异常'));
        }
        //验签获取链地址比对
        $web3 = new Hash();
        $meta_address = $web3->verifyMessage($msg_nonce,$signature);
        if(strtolower($address) != $meta_address) {//（小写）地址一致
            $this->error(__("地址异常"));
        }
        $userInfo = \app\admin\model\User::where("address", $address)->find();
        if (empty($userInfo)) {
            $ret = $this->auth->register($address);
        } else {
            $ret = $this->auth->login($address);
        }
        if ($ret) {
            $data = [
                'userInfo' => $this->auth->getUserinfo(),
            ];
            $this->success(__('登录成功'), $data);
        } else {
            $this->error($this->auth->getError());
        }
    }
}
