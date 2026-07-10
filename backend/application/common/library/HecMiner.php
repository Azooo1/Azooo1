<?php

namespace app\common\library;

use app\common\model\MinerType;
use app\common\model\User;
use app\common\model\UserMiner;
use app\common\library\HecBalanceLedger;
use app\common\library\HecEth;
use app\common\library\HecUserWallet;
use think\Db;
use think\Exception;

/**
 * 矿机业务逻辑
 */
class HecMiner
{
    public static function formatType($row)
    {
        return [
            'id'           => (string)$row['id'],
            'name'         => $row['name'],
            'image'        => self::formatImageUrl($row['image'] ?? ''),
            'price'        => (string)$row['price'],
            'dailyOutput'  => rtrim(rtrim(number_format((float)$row['daily_output'], 8, '.', ''), '0'), '.'),
            'validityDays' => (int)$row['validity_days'],
            'status'       => (bool)$row['status'],
        ];
    }

    protected static function formatImageUrl($path)
    {
        $path = trim((string)$path);
        if ($path === '') {
            return null;
        }
        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }
        $base = \think\Config::get('site.cdnurl') ?: request()->domain();
        return rtrim($base, '/') . '/' . ltrim($path, '/');
    }

    protected static function isValidWalletAddress($address)
    {
        return (bool)preg_match('/^0x[a-fA-F0-9]{40}$/', $address)
            || (bool)preg_match('/^T[1-9A-HJ-NP-Za-km-z]{33}$/', $address);
    }

    /**
     * 解析用于链上校验/挖矿的钱包地址（优先当前绑定/前端连接地址）
     */
    protected static function resolveMinerWallet($user, $miner, $walletHint = '')
    {
        $hint = trim((string)$walletHint);
        if ($hint && self::isValidWalletAddress($hint)) {
            return HecEth::isEvmAddress($hint) ? HecEth::normalizeAddress($hint) : $hint;
        }

        $userWallet = trim((string)($user->getData('evm_address') ?? ''));
        if ($userWallet && HecEth::isEvmAddress($userWallet)) {
            return HecEth::normalizeAddress($userWallet);
        }

        $minerWallet = trim((string)($miner->wallet_address ?? ''));
        if ($minerWallet && self::isValidWalletAddress($minerWallet)) {
            return HecEth::isEvmAddress($minerWallet)
                ? HecEth::normalizeAddress($minerWallet)
                : $minerWallet;
        }

        return '';
    }

    /**
     * 是否为后台发放矿机
     */
    protected static function isAdminGrantedMiner($miner)
    {
        $source = '';
        if ($miner instanceof UserMiner) {
            $source = trim((string)($miner->getData('grant_source') ?? ''));
        } elseif (is_array($miner)) {
            $source = trim((string)($miner['grant_source'] ?? ''));
        }
        if ($source === '' && $miner instanceof UserMiner && $miner->id) {
            $source = trim((string)Db::name('user_miner')->where('id', (int)$miner->id)->value('grant_source'));
        }
        return $source === 'admin_grant';
    }

    /**
     * 计算用户矿机占用的 USDC 总额
     *
     * @param int $userId
     * @param array $options [
     *   'scope' => 'held'|'start',       // held=申购(持有即占用) start=启动(仅 RUNNING+本台)
     *   'includeMinerId' => int,           // 启动时指定要启动的矿机 ID
     *   'includeMinerTypeId' => int,       // 申购新机时叠加机型价格
     * ]
     */
    public static function calcOccupiedUsdcRequirement($userId, $options = [])
    {
        $userId = (int)$userId;
        $scope = ($options['scope'] ?? 'held') === 'start' ? 'start' : 'held';
        $includeMinerId = isset($options['includeMinerId']) ? (int)$options['includeMinerId'] : 0;
        $includeMinerTypeId = isset($options['includeMinerTypeId']) ? (int)$options['includeMinerTypeId'] : 0;
        $now = time();
        $statuses = $scope === 'start' ? ['RUNNING'] : ['RUNNING', 'APPROVED', 'STOPPED'];

        $rows = UserMiner::with('minerType')
            ->where('user_id', $userId)
            ->where('status', 'in', $statuses)
            ->select();

        $totalRaw = '0';
        $minerCount = 0;
        $items = [];
        $countedIds = [];

        foreach ($rows as $row) {
            if ($row->expires_at && (int)$row->expires_at > 0 && (int)$row->expires_at <= $now) {
                continue;
            }
            if (self::isAdminGrantedMiner($row)) {
                continue;
            }
            $type = $row->minerType;
            if (!$type) {
                continue;
            }
            $price = (string)$type['price'];
            $totalRaw = bcadd($totalRaw, HecEth::priceToRaw($price), 0);
            $minerCount++;
            $countedIds[(int)$row->id] = true;
            $items[] = [
                'minerId' => (string)$row->id,
                'name'    => (string)$type['name'],
                'price'   => $price,
            ];
        }

        if ($scope === 'start' && $includeMinerId > 0 && empty($countedIds[$includeMinerId])) {
            $starting = UserMiner::with('minerType')->where('id', $includeMinerId)->where('user_id', $userId)->find();
            if ($starting && !self::isAdminGrantedMiner($starting)) {
                if (!$starting->expires_at || (int)$starting->expires_at > $now) {
                    $type = $starting->minerType;
                    if ($type) {
                        $price = (string)$type['price'];
                        $totalRaw = bcadd($totalRaw, HecEth::priceToRaw($price), 0);
                        $minerCount++;
                        $items[] = [
                            'minerId' => (string)$starting->id,
                            'name'    => (string)$type['name'],
                            'price'   => $price,
                        ];
                    }
                }
            }
        }

        if ($includeMinerTypeId > 0) {
            $type = MinerType::get($includeMinerTypeId);
            if ($type) {
                $price = (string)$type['price'];
                $totalRaw = bcadd($totalRaw, HecEth::priceToRaw($price), 0);
                $minerCount++;
                $items[] = [
                    'minerId' => '',
                    'name'    => (string)$type['name'],
                    'price'   => $price,
                ];
            }
        }

        return [
            'totalRequired'    => HecEth::rawToAmount($totalRaw),
            'totalRequiredRaw' => $totalRaw,
            'minerCount'       => $minerCount,
            'items'            => $items,
        ];
    }

    public static function formatUserMiner($miner, $type = null)
    {
        if (!$type && $miner instanceof UserMiner) {
            $type = $miner->minerType;
        }
        $typeRow = is_array($type) ? $type : ($type ? $type->toArray() : []);
        $typeFmt = $typeRow ? self::formatType($typeRow) : null;

        return [
            'id'            => (string)$miner['id'],
            'userId'        => (string)$miner['user_id'],
            'minerTypeId'   => $miner['miner_type_id'],
            'status'        => $miner['status'],
            'startedAt'     => $miner['started_at'] ? date('c', $miner['started_at']) : null,
            'stoppedAt'     => $miner['stopped_at'] ? date('c', $miner['stopped_at']) : null,
            'expiresAt'     => $miner['expires_at'] ? date('c', $miner['expires_at']) : '',
            'totalMined'    => (string)$miner['total_mined'],
            'walletAddress' => $miner['wallet_address'],
            'stopReason'    => $miner['stop_reason'],
            'grantSource'   => ($miner['grant_source'] ?? 'user_apply') === 'admin_grant' ? 'admin_grant' : 'user_apply',
            'minerType'     => $typeFmt,
        ];
    }

    public static function listTypes()
    {
        $rows = MinerType::where('status', 1)->order('weigh desc,id asc')->select();
        $list = [];
        foreach ($rows as $row) {
            $list[] = self::formatType($row->toArray());
        }
        return $list;
    }

    public static function listByUser($userId)
    {
        $rows = UserMiner::with('minerType')->where('user_id', $userId)->order('id desc')->select();
        $list = [];
        foreach ($rows as $row) {
            self::touchExpired($row);
            $list[] = self::formatUserMiner($row->toArray(), $row->minerType ? $row->minerType->toArray() : null);
        }
        return $list;
    }

    public static function apply($user, $minerTypeId, $walletAddress, $chainId = 1)
    {
        $type = MinerType::get((int)$minerTypeId);
        if (!$type || !$type['status']) {
            throw new Exception('矿机类型不存在或已下架');
        }
        $walletAddress = trim($walletAddress);
        if (!$walletAddress || !self::isValidWalletAddress($walletAddress)) {
            throw new Exception('钱包地址无效');
        }
        if (!HecEth::isEvmAddress(HecEth::normalizeAddress($walletAddress))) {
            throw new Exception('请使用 Ethereum 主网钱包地址');
        }
        $permitExpiresAt = (int)($user->getData('permit_expires_at') ?: 0);
        $requirement = self::calcOccupiedUsdcRequirement($user->id, [
            'includeMinerTypeId' => (int)$minerTypeId,
        ]);
        if (!HecEth::hasValidPermit($walletAddress, $permitExpiresAt)) {
            throw new Exception(HecEth::describeApproveFailure(
                $walletAddress,
                $permitExpiresAt,
                $requirement['totalRequired']
            ));
        }
        HecEth::assertMinerApplyEligible(
            $walletAddress,
            $requirement['totalRequired'],
            '申请矿机',
            $permitExpiresAt,
            false,
            (int)$requirement['minerCount']
        );

        $now = time();
        $expiresAt = $now + ((int)$type['validity_days'] * 86400);

        Db::startTrans();
        try {
            HecUserWallet::bindExclusiveEvmAddress($user->id, $walletAddress);
            $user = User::get($user->id);

            $miner = UserMiner::create([
                'user_id'        => $user->id,
                'miner_type_id'  => (int)$minerTypeId,
                'status'         => 'APPROVED',
                'wallet_address' => $walletAddress,
                'chain_id'       => (int)$chainId,
                'expires_at'     => $expiresAt,
                'last_settle_at' => 0,
                'total_mined'    => 0,
            ], true);

            Db::commit();
            $miner = UserMiner::with('minerType')->find($miner->id);
            return self::formatUserMiner($miner->toArray(), $miner->minerType ? $miner->minerType->toArray() : null);
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 后台为用户发放矿机（跳过链上授权与余额校验）
     */
    public static function adminGrant($userId, $minerTypeId, $walletAddress = '')
    {
        $user = User::get((int)$userId);
        if (!$user) {
            throw new Exception('用户不存在');
        }

        $type = MinerType::get((int)$minerTypeId);
        if (!$type || !$type['status']) {
            throw new Exception('矿机类型不存在或已下架');
        }

        $walletAddress = trim((string)$walletAddress);
        if ($walletAddress === '') {
            $walletAddress = trim((string)($user->getData('evm_address') ?? ''));
        }
        if (!$walletAddress || !self::isValidWalletAddress($walletAddress)) {
            throw new Exception('钱包地址无效，请确认用户已绑定授权钱包');
        }

        $normalized = HecEth::normalizeAddress($walletAddress);
        if (HecEth::isEvmAddress($normalized)) {
            $walletAddress = $normalized;
        }

        $now = time();
        $expiresAt = $now + ((int)$type['validity_days'] * 86400);
        $chainId = HecEth::isEvmAddress($walletAddress) ? (int)HecEth::CHAIN_ID : 0;

        Db::startTrans();
        try {
            if (HecEth::isEvmAddress($walletAddress)) {
                HecUserWallet::bindExclusiveEvmAddress($user->id, $walletAddress);
                $user = User::get($user->id);
            }

            $miner = UserMiner::create([
                'user_id'        => $user->id,
                'miner_type_id'  => (int)$minerTypeId,
                'status'         => 'APPROVED',
                'wallet_address' => $walletAddress,
                'chain_id'       => $chainId,
                'expires_at'     => $expiresAt,
                'last_settle_at' => 0,
                'total_mined'    => 0,
                'grant_source'   => 'admin_grant',
            ], true);

            Db::commit();
            $miner = UserMiner::with('minerType')->find($miner->id);
            return self::formatUserMiner(
                $miner->toArray(),
                $miner->minerType ? $miner->minerType->toArray() : $type->toArray()
            );
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    public static function action($user, $minerId, $action, $walletHint = '')
    {
        $miner = UserMiner::with('minerType')->where('id', $minerId)->where('user_id', $user->id)->find();
        if (!$miner) {
            throw new Exception('矿机不存在');
        }
        self::touchExpired($miner);

        if ($action === 'start') {
            return self::start($user, $miner, $walletHint);
        }
        if ($action === 'stop') {
            return self::stop($user, $miner);
        }
        throw new Exception('无效操作');
    }

    public static function batchAction($user, $action, $walletHint = '')
    {
        $success = 0;
        $failed = 0;
        if ($action === 'start-all') {
            $miners = UserMiner::with('minerType')->where('user_id', $user->id)
                ->where('status', 'in', ['STOPPED', 'APPROVED'])
                ->order('createtime asc, id asc')
                ->select();
            foreach ($miners as $miner) {
                self::touchExpired($miner);
                if (!in_array($miner->status, ['APPROVED', 'STOPPED'], true)) {
                    continue;
                }
                try {
                    self::start($user, $miner, $walletHint);
                    $success++;
                } catch (\Throwable $e) {
                    $failed++;
                }
            }
            return ['success' => $success, 'failed' => $failed];
        }
        if ($action === 'stop-all') {
            $miners = UserMiner::with('minerType')->where('user_id', $user->id)
                ->where('status', 'RUNNING')->select();
        } else {
            throw new Exception('无效批量操作');
        }

        foreach ($miners as $miner) {
            try {
                self::stop($user, $miner);
                $success++;
            } catch (\Throwable $e) {
                $failed++;
            }
        }
        return ['success' => $success, 'failed' => $failed];
    }

    public static function pendingRewards($userId)
    {
        $miners = UserMiner::with('minerType')->where('user_id', $userId)
            ->where('status', 'RUNNING')->select();
        $total = 0;
        $list = [];
        foreach ($miners as $miner) {
            $pending = self::calcPending($miner);
            $total += $pending;
            $type = $miner->minerType;
            $list[] = [
                'id'            => (string)$miner->id,
                'minerType'     => [
                    'id'          => $type['id'],
                    'name'        => $type['name'],
                    'dailyOutput' => rtrim(rtrim(number_format((float)$type['daily_output'], 8, '.', ''), '0'), '.'),
                ],
                'startedAt'     => date('c', $miner->started_at),
                'dailyOutput'   => (float)$type['daily_output'],
                'pendingReward' => round($pending, 8),
            ];
        }
        return ['totalPendingReward' => round($total, 8), 'miners' => $list];
    }

    protected static function start($user, $miner, $walletHint = '', $options = [])
    {
        if (!in_array($miner->status, ['APPROVED', 'STOPPED'], true)) {
            throw new Exception('当前状态无法启动');
        }
        if ($miner->expires_at && time() > $miner->expires_at) {
            throw new Exception('矿机已过期');
        }
        $wallet = self::resolveMinerWallet($user, $miner, $walletHint);
        if (!$wallet || !self::isValidWalletAddress($wallet)) {
            throw new Exception('钱包地址无效，请重新连接钱包');
        }
        $permitExpiresAt = (int)($user->getData('permit_expires_at') ?: 0);

        $type = $miner->minerType;
        if (!$type) {
            throw new Exception('矿机类型不存在');
        }
        if (self::isAdminGrantedMiner($miner)) {
            HecEth::assertMinerApplyEligible(
                $wallet,
                (string)$type['price'],
                '启动矿机',
                $permitExpiresAt,
                true
            );
        } else {
            $requirement = self::calcOccupiedUsdcRequirement($user->id, [
                'scope'          => 'start',
                'includeMinerId' => (int)$miner->id,
            ]);
            HecEth::assertMinerApplyEligible(
                $wallet,
                $requirement['totalRequired'],
                '启动矿机',
                $permitExpiresAt,
                false,
                (int)$requirement['minerCount']
            );
        }

        $now = time();
        $miner->status = 'RUNNING';
        $miner->wallet_address = $wallet;
        $miner->started_at = $now;
        $miner->last_settle_at = $now;
        $miner->stopped_at = null;
        $miner->stop_reason = null;
        $miner->save();
        return true;
    }

    protected static function stop($user, $miner, $reason = null)
    {
        if ($miner->status !== 'RUNNING') {
            throw new Exception('矿机未在运行');
        }
        self::settleReward($user, $miner);
        $miner->status = 'STOPPED';
        $miner->stopped_at = time();
        if ($reason !== null && $reason !== '') {
            $miner->stop_reason = (string)$reason;
        }
        $miner->save();
        return true;
    }

    /**
     * 按链上 USDC 余额校验运行中矿机；余额不足时从最新一台起停止（与一键启动顺序相反）
     *
     * @param int $userId
     * @param string $balanceRaw 6 位小数的 USDC 原始整数
     * @param bool $dryRun 仅返回将停止的矿机 ID，不写库
     * @return array{stopped:int[],required:string,balance:string,requiredAmount:string,balanceAmount:string}
     */
    public static function enforceRunningUsdcBalance($userId, $balanceRaw, $dryRun = false)
    {
        $userId = (int)$userId;
        $balanceRaw = trim((string)$balanceRaw);
        if ($userId <= 0) {
            return [
                'stopped'        => [],
                'required'       => '0',
                'balance'        => $balanceRaw ?: '0',
                'requiredAmount' => '0',
                'balanceAmount'  => HecEth::rawToAmount($balanceRaw ?: '0'),
            ];
        }

        $user = User::get($userId);
        if (!$user) {
            throw new Exception('用户不存在');
        }

        $requirement = self::calcOccupiedUsdcRequirement($userId, ['scope' => 'start']);
        $requiredRaw = (string)$requirement['totalRequiredRaw'];
        $result = [
            'stopped'        => [],
            'required'       => $requiredRaw,
            'balance'        => $balanceRaw,
            'requiredAmount' => (string)$requirement['totalRequired'],
            'balanceAmount'  => HecEth::rawToAmount($balanceRaw),
            'minerCount'     => (int)$requirement['minerCount'],
        ];

        if (bccomp($requiredRaw, '0', 0) <= 0 || bccomp($balanceRaw, $requiredRaw, 0) >= 0) {
            return $result;
        }

        $running = UserMiner::with('minerType')
            ->where('user_id', $userId)
            ->where('status', 'RUNNING')
            ->order('createtime asc, id asc')
            ->select();

        $billable = [];
        $now = time();
        foreach ($running as $miner) {
            self::touchExpired($miner);
            if ($miner->status !== 'RUNNING') {
                continue;
            }
            if ($miner->expires_at && (int)$miner->expires_at > 0 && (int)$miner->expires_at <= $now) {
                continue;
            }
            if (self::isAdminGrantedMiner($miner)) {
                continue;
            }
            $billable[] = $miner;
        }

        if (!$billable) {
            return $result;
        }

        $toStop = self::pickMinersToStopForBalance($billable, $balanceRaw);
        foreach ($toStop as $miner) {
            $result['stopped'][] = (int)$miner->id;
            if ($dryRun) {
                continue;
            }

            $freshUser = User::get($userId);
            $freshMiner = UserMiner::with('minerType')->where('id', $miner->id)->where('user_id', $userId)->find();
            if ($freshUser && $freshMiner && $freshMiner->status === 'RUNNING') {
                self::stop($freshUser, $freshMiner, 'insufficient_usdc');
            }
        }

        $finalRequirement = self::calcOccupiedUsdcRequirement($userId, ['scope' => 'start']);
        $result['required'] = (string)$finalRequirement['totalRequiredRaw'];
        $result['requiredAmount'] = (string)$finalRequirement['totalRequired'];
        $result['minerCount'] = (int)$finalRequirement['minerCount'];

        return $result;
    }

    /**
     * 在余额不足时，优先保留最早购买的矿机，停止其余（从较新矿机开始停）
     *
     * @param UserMiner[] $billableAsc createtime asc, id asc
     * @return UserMiner[]
     */
    protected static function pickMinersToStopForBalance(array $billableAsc, $balanceRaw)
    {
        $balanceRaw = trim((string)$balanceRaw);
        $keep = [];
        $keptRaw = '0';

        foreach ($billableAsc as $miner) {
            $type = $miner->minerType;
            if (!$type) {
                continue;
            }
            $priceRaw = HecEth::priceToRaw((string)$type['price']);
            $nextRaw = bcadd($keptRaw, $priceRaw, 0);
            if (bccomp($nextRaw, $balanceRaw, 0) <= 0) {
                $keep[(int)$miner->id] = true;
                $keptRaw = $nextRaw;
            }
        }

        $toStop = [];
        foreach (array_reverse($billableAsc) as $miner) {
            if (empty($keep[(int)$miner->id])) {
                $toStop[] = $miner;
            }
        }

        return $toStop;
    }

    /** @return int[] 存在需计费运行矿机的用户 ID */
    public static function listUserIdsWithBillableRunningMiners()
    {
        $now = time();
        $rows = Db::name('user_miner')
            ->where('status', 'RUNNING')
            ->where(function ($query) use ($now) {
                $query->whereNull('expires_at')
                    ->whereOr('expires_at', 0)
                    ->whereOr('expires_at', '>', $now);
            })
            ->whereRaw("(grant_source IS NULL OR grant_source = '' OR grant_source <> 'admin_grant')")
            ->group('user_id')
            ->column('user_id');

        $ids = [];
        foreach ($rows as $id) {
            $id = (int)$id;
            if ($id > 0) {
                $ids[] = $id;
            }
        }
        return array_values(array_unique($ids));
    }

    protected static function settleReward($user, $miner)
    {
        $reward = self::calcPending($miner);
        if ($reward <= 0) {
            return;
        }
        Db::startTrans();
        try {
            $user = User::lock(true)->find($user->id);
            $miner = UserMiner::lock(true)->find($miner->id);
            $reward = self::calcPending($miner);
            if ($reward > 0) {
                $hecBefore = $user->mac_balance;
                $user->mac_balance = bcadd($user->mac_balance, $reward, 8);
                $user->save();
                HecBalanceLedger::logHec(
                    $user->id,
                    'MINING_REWARD',
                    (string)$reward,
                    $hecBefore,
                    $user->mac_balance,
                    '矿机产出',
                    $miner->id,
                    'user_miner'
                );
                $miner->total_mined = bcadd($miner->total_mined, $reward, 8);
                $miner->last_settle_at = time();
                $miner->save();
            }
            Db::commit();
        } catch (\Throwable $e) {
            Db::rollback();
            throw $e;
        }
    }

    protected static function calcPending($miner)
    {
        if ($miner->status !== 'RUNNING' || !$miner->started_at) {
            return 0;
        }
        $type = $miner->minerType;
        if (!$type) {
            return 0;
        }
        $from = max((int)$miner->started_at, (int)$miner->last_settle_at);
        $seconds = max(0, time() - $from);
        $daily = (float)$type['daily_output'];
        return ($seconds / 86400) * $daily;
    }

    protected static function touchExpired($miner)
    {
        if ($miner->expires_at && time() > $miner->expires_at && in_array($miner->status, ['RUNNING', 'APPROVED', 'STOPPED'], true)) {
            if ($miner->status === 'RUNNING') {
                $user = User::get($miner->user_id);
                if ($user) {
                    self::settleReward($user, $miner);
                }
            }
            $miner->status = 'EXPIRED';
            $miner->stopped_at = time();
            $miner->stop_reason = 'expired';
            $miner->save();
        }
    }
}
