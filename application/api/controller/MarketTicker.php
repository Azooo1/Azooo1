<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use think\Config;

/**
 * 市场行情 API
 */
class MarketTicker extends HecApi
{
    protected $noNeedLogin = ['index'];

    /**
     * GET /api/market-ticker
     */
    public function index()
    {
        $list = Config::get('hec.market_ticker') ?: [];
        $hecPrice = \app\common\library\HecFinance::currentPrice();
        foreach ($list as &$item) {
            if (($item['symbol'] ?? '') === 'HEC') {
                $item['price'] = $hecPrice;
            }
        }
        unset($item);
        $this->hecJson(['success' => true, 'data' => $list]);
    }
}
