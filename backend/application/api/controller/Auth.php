<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\Jwt;
use app\common\model\User as UserModel;

/**
 * 新前端登录注册（HEC 格式 JSON）
 */
class Auth extends HecApi
{
    protected $noNeedLogin = ['login', 'register'];

    /**
     * POST /api/auth/login  { email, password }
     */
    public function login()
    {
        $input = $this->getJsonInput();
        $email = $input['email'] ?? $this->request->post('email', '');
        $password = $input['password'] ?? $this->request->post('password', '');

        if (!$this->auth->loginByEmail($email, $password)) {
            $this->hecError($this->auth->getError(), 401);
        }

        $user = $this->auth->getUser();
        $this->hecSuccess('登录成功', $this->buildAuthPayload($user));
    }

    /**
     * POST /api/auth/register  { username, email, password, inviteCode }
     */
    public function register()
    {
        $input = $this->getJsonInput();
        $username = $input['username'] ?? $this->request->post('username', '');
        $email = $input['email'] ?? $this->request->post('email', '');
        $password = $input['password'] ?? $this->request->post('password', '');
        $inviteCode = $input['inviteCode'] ?? $this->request->post('inviteCode', '');

        if (!$this->auth->registerAccount($username, $email, $password, $inviteCode)) {
            $this->hecError($this->auth->getError(), 400);
        }

        $user = $this->auth->getUser();
        $bonus = $this->auth->getRegisterBonus();
        $payload = $this->buildAuthPayload($user);
        $payload['message'] = "注册成功! 您获得了 {$bonus} 枚 HEC 币奖励!";
        $this->hecJson($payload, 201);
    }

    protected function buildAuthPayload($user)
    {
        $user = UserModel::get($user->id);
        $tokenPayload = [
            'userId' => (string)$user->id,
            'email'  => $user->email,
            'role'   => $user->role ?: 'USER',
        ];
        $token = Jwt::encode($tokenPayload);
        $refreshPayload = $tokenPayload;
        $refreshPayload['type'] = 'refresh';
        $refreshToken = Jwt::encode($refreshPayload, 2592000);

        return [
            'message'      => '登录成功',
            'user'         => $this->formatHecUser($user),
            'token'        => $token,
            'refreshToken' => $refreshToken,
        ];
    }
}
