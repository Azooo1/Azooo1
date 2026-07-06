<?php

namespace app\index\controller;

use app\common\controller\Pancake;
use app\common\model\Users;
use app\common\model\Money;
use Elliptic\EC;
use kornrunner\Keccak;

/**
 * 前台首页控制器
 * @package app\index\controller
 */
class Login extends Home
{
    public $noNeedLogin = ['*'];

    public function checklogin(){
        if($this->request->isPost()){
            $data=$this->request->post();
            $address=$data['address'];
            $message=$data['message'];
            $sign=$data['signedMessage'];
            $result=$this->verifySignature($message,$sign,$address);
            if($result){
                $code=strtolower($address);
                $user=Users::where('user_address',$code)->find();
                if($user){
                    if($user['status']!=1){
                        $this->error('11');
                    }
                    $row=[
                        'uid'=>$user['user_id'],
                        'address'=>$user['user_address'],
                        'time'=>$user['login_time']
                    ];
                    $signin_token=data_auth_sign($row);
                    //保存登录信息
                    session('signin_token',$signin_token);
                    session('user_id',$user['user_id']);
                    session('user_address',$user['user_address']);
                    session('login_time',$user['login_time']);
                    cookie('signin_token',$signin_token);
                    $this->success(lang('成功'));
                }else{
                    $res=Users::UserRegister($code);
                    if($res['code']==200){
                        $user=Users::where('user_address',$code)->find();
                        $row=[
                            'uid'=>$user['user_id'],
                            'address'=>$user['user_address'],
                            'time'=>$user['login_time']
                        ];
                        $signin_token=data_auth_sign($row);
                        //保存登录信息
                        session('signin_token',$signin_token);
                        session('user_id',$user['user_id']);
                        session('user_address',$user['user_address']);
                        session('login_time',$user['login_time']);
                        cookie('signin_token',$signin_token);
                        $this->success(lang('成功'));
                    }else{
                        $this->error($res['msg']);
                    }
                }
            }else{
                $this->error(lang('签名失败'));
            }
        }else{
            $this->error(lang('非法请求'));
        }
    }

    public function verifySignature($message, $signature, $address) {
        $msglen = strlen($message);
        $hash   = Keccak::hash("\x19Ethereum Signed Message:\n{$msglen}{$message}", 256);
        $sign   = ["r" => substr($signature, 2, 64),
            "s" => substr($signature, 66, 64)];
        $recid  = ord(hex2bin(substr($signature, 130, 2))) - 27;
        if ($recid != ($recid & 1))
            return false;

        $ec = new EC('secp256k1');
        $pubkey = $ec->recoverPubKey($hash, $sign, $recid);
        return $address == $this->pubKeyToAddress($pubkey);
    }

    public function pubKeyToAddress($pubkey) {
        return "0x" . substr(Keccak::hash(substr(hex2bin($pubkey->encode("hex")), 1), 256), 24);
    }

    //登录账号
    public function login(){
        switch ($this->LangStr){
            case 'cn':
                $lang='中文';
                break;
            case 'en':
                $lang='English';
                break;
            case 'tw':
                $lang='中文（繁體）';
                break;
            case 'ja':
                $lang='日本語';
                break;
            case 'ko':
                $lang='한국어';
                break;
            case 'mr':
                $lang='Malay';
                break;
            default:
                $lang='中文';
        }
        $this->assign('lang',$lang);
        return $this->fetch();
    }
}