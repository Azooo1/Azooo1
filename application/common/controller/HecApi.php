<?php

namespace app\common\controller;

use app\common\model\User as UserModel;
use think\Response;

/**
 * 新前端 HEC API 基类（JSON 格式与 hecminai 对齐）
 */
class HecApi extends Api
{
    protected function getJsonInput()
    {
        $raw = $this->request->getContent();
        if (!$raw) {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    protected function formatHecUser($user)
    {
        return [
            'id'            => (string)$user->id,
            'username'      => $user->username,
            'email'         => $user->email,
            'role'          => $user->role ?: 'USER',
            'macBalance'    => (string)($user->mac_balance ?? 0),
            'ethBalance'    => (string)($user->eth_balance ?? 0),
            'usdcBalance'   => (string)($user->usdt_balance ?? 0),
            'usdtBalance'   => (string)($user->usdt_balance ?? 0),
            'evmAddress'    => $user->evm_address ?: ($user->address ?: null),
            'solanaAddress' => $user->solana_address ?: null,
            'inviteCode'    => $user->invite_code,
        ];
    }

    protected function hecSuccess($message, array $data = [], $status = 200)
    {
        $data['message'] = $message;
        $this->hecJson($data, $status);
    }

    protected function hecError($error, $status = 400)
    {
        $this->hecJson(['error' => $error], $status);
    }

    protected function hecJson(array $data, $status = 200)
    {
        $response = Response::create($data, 'json', $status);
        throw new \think\exception\HttpResponseException($response);
    }

    protected function requireUser()
    {
        if (!$this->auth->isLogin()) {
            $this->hecError('请先登录', 401);
        }
        $user = UserModel::get($this->auth->id);
        if (!$user) {
            $this->hecError('用户不存在', 401);
        }
        return $user;
    }

    protected function assertNotSalesman($user)
    {
        if (strtoupper($user->role ?: 'USER') === 'SALESMAN') {
            $this->hecError('业务员账号无法操作矿机', 403);
        }
    }

    /**
     * HEC 接口统一错误格式
     */
    protected function error($msg = '', $data = null, $code = 0, $type = null, array $header = [])
    {
        $status = 400;
        if ($code === 401) {
            $status = 401;
        } elseif ($code === 403) {
            $status = 403;
        }
        $this->hecError($msg ?: '请求失败', $status);
    }
}
