<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecMiner;
use think\Exception;

/**
 * 矿机 API
 */
class Miners extends HecApi
{
    protected $noNeedLogin = ['index'];

    /**
     * GET /api/miners  矿机类型列表
     * POST /api/miners  申请矿机
     */
    public function index()
    {
        if ($this->request->isPost()) {
            $this->apply();
            return;
        }
        $this->hecJson(['minerTypes' => HecMiner::listTypes()]);
    }

    /**
     * GET /api/miners/my
     */
    public function my()
    {
        $user = $this->requireUser();
        $this->hecJson(['miners' => HecMiner::listByUser($user->id)]);
    }

    /**
     * GET /api/miners/pending_rewards
     */
    public function pending_rewards()
    {
        $user = $this->requireUser();
        $this->hecJson(HecMiner::pendingRewards($user->id));
    }

    /**
     * POST /api/miners/batch_action
     */
    public function batch_action()
    {
        $user = $this->requireUser();
        $this->assertNotSalesman($user);
        $input = $this->getJsonInput();
        $action = $input['action'] ?? '';
        $walletAddress = trim((string)($input['walletAddress'] ?? ''));
        try {
            $result = HecMiner::batchAction($user, $action, $walletAddress);
            $this->hecJson(array_merge($result, ['message' => '操作完成']));
        } catch (Exception $e) {
            $this->hecError($e->getMessage());
        }
    }

    /**
     * POST /api/miners/action
     * POST /api/miners/:id/action
     */
    public function do_action()
    {
        $user = $this->requireUser();
        $this->assertNotSalesman($user);
        $input = $this->getJsonInput();
        $minerId = $input['minerId'] ?? $this->request->param('id');
        $action = $input['action'] ?? '';
        $walletAddress = trim((string)($input['walletAddress'] ?? ''));
        try {
            HecMiner::action($user, $minerId, $action, $walletAddress);
            $this->hecJson(['message' => $action === 'start' ? '矿机已启动' : '矿机已停止']);
        } catch (Exception $e) {
            $this->hecError($e->getMessage());
        }
    }

    /** @deprecated 使用 do_action */
    public function action()
    {
        $this->do_action();
    }

    protected function apply()
    {
        $user = $this->requireUser();
        $this->assertNotSalesman($user);
        $input = $this->getJsonInput();
        $minerTypeId = $input['minerTypeId'] ?? '';
        $walletAddress = $input['walletAddress'] ?? '';
        $chainId = $input['chainId'] ?? 1;
        try {
            $miner = HecMiner::apply($user, $minerTypeId, $walletAddress, $chainId);
            $this->hecJson(['miner' => $miner, 'message' => '矿机申请成功，请点击启动'], 201);
        } catch (Exception $e) {
            $this->hecError($e->getMessage());
        }
    }
}
