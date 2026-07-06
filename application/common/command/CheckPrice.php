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
use app\common\controller\Price;

class CheckPrice extends Command
{
    protected function configure()
    {
        $this->setName('CheckPrice')
            ->setDescription('代币价格处理');
    }

    protected function execute(Input $input,Output $output)
    {
        $res=(new Price())->setPrice();
        if($res){
            $output->writeln(date('Y-m-d H:i:s')."代币价格处理成功");
        }
    }
}
