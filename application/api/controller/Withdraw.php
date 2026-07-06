<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecFinance;
use think\Exception;

/**
 * 提币 API
 */
class Withdraw extends HecApi
{
    /**
     * GET /api/withdraw
     * POST /api/withdraw
     */
    public function index()
    {
        $user = $this->requireUser();
        if ($this->request->isPost()) {
            $input = $this->getJsonInput();
            try {
                $withdrawal = HecFinance::submitWithdraw($user, $input);
                $this->hecJson(['message' => '提币申请已提交', 'withdrawal' => $withdrawal], 201);
            } catch (Exception $e) {
                $this->hecError($e->getMessage());
            }
            return;
        }
        $this->hecJson([
            'withdrawals' => HecFinance::listWithdrawals($user->id),
            'config'      => HecFinance::withdrawConfig(),
        ]);
    }
}
