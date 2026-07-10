<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecFinance;
use think\Exception;

/**
 * 闪兑 API
 */
class Exchange extends HecApi
{
    /**
     * GET /api/exchange
     * POST /api/exchange
     */
    public function index()
    {
        $user = $this->requireUser();
        if ($this->request->isPost()) {
            $input = $this->getJsonInput();
            $fromAmount = $input['fromAmount'] ?? 0;
            $toCurrency = $input['toCurrency'] ?? 'USDT';
            if (strtoupper((string)$toCurrency) === 'USDC') {
                $toCurrency = 'USDT';
            }
            try {
                $result = HecFinance::executeExchange($user, $fromAmount, $toCurrency);
                $this->hecJson(array_merge($result, ['message' => '兑换成功']));
            } catch (Exception $e) {
                $this->hecError($e->getMessage());
            }
            return;
        }
        $this->hecJson([
            'exchanges' => HecFinance::listExchanges($user->id),
            'config'    => HecFinance::exchangeConfig(),
        ]);
    }
}
