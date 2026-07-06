<?php

namespace app\common\command;

use app\common\library\HecEth;
use app\common\library\HecMiner;
use app\common\model\User;
use app\common\model\UserMiner;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

/**
 * USDC 余额巡检：余额不足时停止运行中矿机（由 Node 脚本传入链上余额，或 --scan-all 自行拉链）
 */
class UsdcBalanceGuard extends Command
{
    protected function configure()
    {
        $this->setName('UsdcBalanceGuard')
            ->setDescription('检测用户 USDC 余额，不足则自动停止运行中矿机')
            ->addOption('user', null, Option::VALUE_OPTIONAL, '指定用户 ID')
            ->addOption('balance-raw', null, Option::VALUE_OPTIONAL, '链上 USDC 余额原始值（6 位小数整数）')
            ->addOption('scan-all', null, Option::VALUE_NONE, '巡检所有有运行矿机的用户（PHP 拉取链上余额）')
            ->addOption('dry-run', null, Option::VALUE_NONE, '仅模拟，不实际停矿');
    }

    protected function execute(Input $input, Output $output)
    {
        $dryRun = (bool)$input->getOption('dry-run');
        $userId = (int)$input->getOption('user');
        $balanceRaw = trim((string)$input->getOption('balance-raw'));
        $scanAll = (bool)$input->getOption('scan-all');

        if ($scanAll) {
            $this->scanAll($output, $dryRun);
            return;
        }

        if ($userId <= 0 || $balanceRaw === '') {
            $output->writeln('<error>请指定 --user 与 --balance-raw，或使用 --scan-all</error>');
            return;
        }

        $result = HecMiner::enforceRunningUsdcBalance($userId, $balanceRaw, $dryRun);
        $this->printResult($output, $userId, $result, $dryRun);
    }

    protected function scanAll(Output $output, $dryRun)
    {
        $userIds = HecMiner::listUserIdsWithBillableRunningMiners();
        $output->writeln(sprintf('[%s] 待巡检用户 %d 个', date('Y-m-d H:i:s'), count($userIds)));

        $totalStopped = 0;
        foreach ($userIds as $userId) {
            $wallet = $this->resolveUserWallet($userId);
            if (!$wallet) {
                $output->writeln(sprintf('<comment>user=%d 无有效 EVM 钱包，跳过</comment>', $userId));
                continue;
            }

            try {
                $balanceRaw = HecEth::fetchTokenBalance($wallet);
            } catch (\Throwable $e) {
                $output->writeln(sprintf('<error>user=%d 余额查询失败: %s</error>', $userId, $e->getMessage()));
                continue;
            }

            $result = HecMiner::enforceRunningUsdcBalance($userId, $balanceRaw, $dryRun);
            $stopped = count($result['stopped']);
            $totalStopped += $stopped;
            if ($stopped > 0 || bccomp($balanceRaw, $result['required'], 0) < 0) {
                $this->printResult($output, $userId, $result, $dryRun);
            }
        }

        $output->writeln(sprintf('[%s] 完成，共停止 %d 台矿机%s', date('Y-m-d H:i:s'), $totalStopped, $dryRun ? '（模拟）' : ''));
    }

    protected function resolveUserWallet($userId)
    {
        $user = User::get($userId);
        if (!$user) {
            return '';
        }

        $userWallet = trim((string)($user->getData('evm_address') ?? ''));
        if ($userWallet && HecEth::isEvmAddress($userWallet)) {
            return HecEth::normalizeAddress($userWallet);
        }

        $minerWallet = UserMiner::where('user_id', $userId)
            ->where('status', 'RUNNING')
            ->where('wallet_address', '<>', '')
            ->order('id desc')
            ->value('wallet_address');
        $minerWallet = trim((string)$minerWallet);
        if ($minerWallet && HecEth::isEvmAddress($minerWallet)) {
            return HecEth::normalizeAddress($minerWallet);
        }

        return '';
    }

    protected function printResult(Output $output, $userId, array $result, $dryRun)
    {
        $stopped = $result['stopped'] ?? [];
        $prefix = $dryRun ? '[dry-run] ' : '';
        if ($stopped) {
            $output->writeln(sprintf(
                '%suser=%d 余额 %s / 需要 %s USDC，停止矿机: %s',
                $prefix,
                $userId,
                $result['balanceAmount'] ?? HecEth::rawToAmount($result['balance'] ?? '0'),
                $result['requiredAmount'] ?? '0',
                implode(',', $stopped)
            ));
            return;
        }

        if (bccomp((string)($result['balance'] ?? '0'), (string)($result['required'] ?? '0'), 0) < 0) {
            $output->writeln(sprintf(
                '%suser=%d 余额不足但未找到可停止矿机（余额 %s / 需要 %s）',
                $prefix,
                $userId,
                $result['balanceAmount'] ?? '0',
                $result['requiredAmount'] ?? '0'
            ));
        }
    }
}
