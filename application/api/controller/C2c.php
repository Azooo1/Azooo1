<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecC2c;
use app\common\library\HecFinance;
use think\Exception;

/**
 * C2C 交易 API
 */
class C2c extends HecApi
{
    /**
     * GET  /api/c2c
     * POST /api/c2c
     */
    public function index()
    {
        $user = $this->requireUser();

        if ($this->request->isPost()) {
            $input = $this->getJsonInput();
            $amount = $input['amount'] ?? 0;
            $price = $input['price'] ?? 0;
            try {
                $order = HecC2c::createSellOrder($user, $amount, $price);
                $this->hecJson(['message' => '发布成功', 'order' => $order], 201);
            } catch (Exception $e) {
                $this->hecError($e->getMessage());
            }
            return;
        }

        $this->hecJson([
            'orders'       => HecC2c::listOrders($user->id),
            'currentPrice' => HecFinance::currentPrice(),
            'config'       => HecC2c::config(),
        ]);
    }

    /**
     * DELETE /api/c2c/:id
     */
    public function cancel()
    {
        $user = $this->requireUser();
        $id = $this->request->param('id', '');
        if ($id === '') {
            $this->hecError('订单不存在', 404);
        }

        try {
            $order = HecC2c::cancelOrder($user, $id);
            $this->hecJson(['message' => '订单已取消', 'order' => $order]);
        } catch (Exception $e) {
            $this->hecError($e->getMessage());
        }
    }
}
