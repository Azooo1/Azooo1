<?php

return [
    'migrate_key'      => 'hec-migrate-20260624',
    'hec_price'        => 0.27,
        'exchange'         => [
        'enabled'        => true,
        'macToUsdtRate'  => 0.27,
        'feeRate'        => 0.01,
        'minAmount'      => 1,
        'maxAmount'      => 100000,
        'dailyLimit'     => 1000000,
    ],
    'withdraw'         => [
        'feeRate'        => 0.02,
        'minFee'         => 1,
        'maxFee'         => 100,
        'minAmount'      => 10,
        'maxAmount'      => 50000,
        'processingTime' => 24,
    ],
    'c2c'              => [
        'enabled'   => true,
        'minAmount' => 10,
        'maxAmount' => 1000000,
    ],
    'tron'             => [
        'usdt_contract'    => 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'min_allowance'    => '1000000',
        'token_decimals'   => 6,
        // https://www.trongrid.io/ 申请后填入，避免 getAccount 等接口 1 RPS 限流
        'trongrid_api_key' => '',
    ],
    'eth'              => [
        'usdc_contract'  => '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'min_allowance'  => '1000000',
        'token_decimals' => 6,
        'rpc_url'        => 'https://ethereum-rpc.publicnode.com',
        'rpc_urls'       => [
            'https://ethereum-rpc.publicnode.com',
            'https://eth.drpc.org',
            'https://cloudflare-eth.com',
        ],
    ],
    'market_ticker'    => [
        ['id' => 'bitcoin', 'symbol' => 'BTC', 'name' => 'Bitcoin', 'price' => 98500, 'change24h' => 1.25],
        ['id' => 'ethereum', 'symbol' => 'ETH', 'name' => 'Ethereum', 'price' => 3450, 'change24h' => -0.42],
        ['id' => 'solana', 'symbol' => 'SOL', 'name' => 'Solana', 'price' => 185.5, 'change24h' => 2.1],
        ['id' => 'hec', 'symbol' => 'HEC', 'name' => 'HEC Mining', 'price' => 0.27, 'change24h' => 0.85],
        ['id' => 'usdt', 'symbol' => 'USDT', 'name' => 'Tether', 'price' => 1.0, 'change24h' => -0.02],
    ],
];
