<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecCustomerService;
use app\common\library\HecEth;

/**
 * 系统配置 API
 */
class System extends HecApi
{
    protected $noNeedLogin = ['admin_wallet', 'admin-wallet', 'customer_service', 'customer-service'];

    /**
     * GET /api/system/admin-wallet?chainId=1
     * 返回平台收款/授权 spender 地址（Ethereum）
     */
    public function admin_wallet()
    {
        $address = HecEth::adminWallet();
        if ($address === '') {
            $this->hecError('平台钱包未配置，请在后台 HEC配置 填写 0x 开头的 Ethereum 地址', 503);
        }

        $chainId = (int)$this->request->get('chainId', HecEth::CHAIN_ID);
        $this->hecJson([
            'address' => $address,
            'chainId' => $chainId,
            'network' => 'Ethereum',
            'token'   => HecEth::usdcContract(),
        ]);
    }

    /**
     * GET /api/config/customer-service
     * GET /api/system/customer-service
     * 返回在线客服（SaleSmartly）配置
     */
    public function customer_service()
    {
        $this->hecJson(HecCustomerService::toPublicArray());
    }
}
