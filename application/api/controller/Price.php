<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecFinance;

/**
 * HEC 价格 API
 */
class Price extends HecApi
{
    protected $noNeedLogin = ['index', 'history'];

    /**
     * GET /api/price
     */
    public function index()
    {
        $price = HecFinance::currentPrice();
        $trend = HecFinance::priceTrend();
        $this->hecJson([
            'success' => true,
            'data'    => [
                'currentPrice' => $price,
                'trend'        => $trend,
            ],
        ]);
    }

    /**
     * GET /api/price/history?days=30
     */
    public function history()
    {
        $days = (int)$this->request->get('days', 30);
        $days = max(1, min(365, $days));
        $data = HecFinance::priceHistory($days);
        $this->hecJson([
            'success'      => true,
            'data'         => $data,
            'currentPrice' => HecFinance::currentPrice(),
        ]);
    }
}
