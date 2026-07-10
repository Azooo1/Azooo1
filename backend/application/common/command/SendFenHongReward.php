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
use app\common\controller\SendCoverReward as CoverJobs;

class SendFenHongReward extends Command
{
    protected function configure()
    {
        $this->setName('SendFenHongReward')
            ->setDescription('节点奖励发放');
    }

    protected function execute(Input $input,Output $output)
    {
        $res=(new CoverJobs())->SendFenHongReward();
        if($res){
            $output->writeln(date('Y-m-d H:i:s')."节点奖励发放成功");
        }
    }
}
