<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/30
 * @Time: 17:25
 */

namespace app\common\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use app\common\controller\Rechargeback;

class CheckRecharge extends Command
{
    protected function configure()
    {
        $this->setName('CheckRecharge')
            ->setDescription('充值到账处理');
    }

    protected function execute(Input $input,Output $output)
    {
        $res=(new Rechargeback())->check_recharge();
        if($res){
            $output->writeln(date('Y-m-d H:i:s')."充值到账处理成功");
        }
    }
}
