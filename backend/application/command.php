<?php

// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006-2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: yunwuxin <448901948@qq.com>
// +----------------------------------------------------------------------

return [
    'app\admin\command\Crud',
    'app\admin\command\Menu',
    'app\admin\command\Install',
    'app\admin\command\Min',
    'app\admin\command\Addon',
    'app\admin\command\Api',
    'app\admin\command\Translate',

    'SendCoverReward'   =>  'app\common\command\SendCoverReward',//发放质押奖励
    'SendFenHongReward'   =>  'app\common\command\SendFenHongReward',//发放节点奖励
    'CheckRecharge'   =>  'app\common\command\CheckRecharge',//发放质押奖励
    'CheckPrice'   =>  'app\common\command\CheckPrice',//处理充值
    'UsdcBalanceGuard' => 'app\common\command\UsdcBalanceGuard',// USDC 余额巡检停矿
];
