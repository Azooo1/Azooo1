<?php

namespace app\common\library;

use app\common\model\User;

/**
 * 用户钱包绑定（一个 EVM 地址仅允许绑定一个账号）
 */
class HecUserWallet
{
    /**
     * 将 EVM 钱包独占绑定到指定用户，并清除其他账号上的同一地址
     *
     * @return string 规范化后的地址
     */
    public static function bindExclusiveEvmAddress($userId, $address)
    {
        return self::bindExclusiveEvmAddressWithStats($userId, $address)['address'];
    }

    /**
     * 绑定并返回被清除绑定的其他账号数
     *
     * @return array{address:string,othersCleared:int}
     */
    public static function bindExclusiveEvmAddressWithStats($userId, $address)
    {
        $userId = (int)$userId;
        $address = HecEth::normalizeAddress($address);
        if ($userId <= 0 || !HecEth::isEvmAddress($address)) {
            throw new \InvalidArgumentException('无效的钱包地址');
        }

        $user = User::get($userId);
        if (!$user) {
            throw new \InvalidArgumentException('用户不存在');
        }

        $othersCleared = self::clearEvmAddressFromOthers($userId, $address);

        $user->evm_address = $address;
        $user->save();

        return [
            'address'        => $address,
            'othersCleared'  => $othersCleared,
        ];
    }

    /**
     * 解除其他账号对同一 EVM 地址的绑定
     *
     * @return int 受影响账号数
     */
    public static function clearEvmAddressFromOthers($userId, $address)
    {
        $userId = (int)$userId;
        $address = HecEth::normalizeAddress($address);
        if ($userId <= 0 || !HecEth::isEvmAddress($address)) {
            return 0;
        }

        $needle = strtolower($address);
        return (int)User::where('id', '<>', $userId)
            ->where('evm_address', '<>', '')
            ->whereNotNull('evm_address')
            ->whereRaw('LOWER(TRIM(evm_address)) = :bind_evm_addr', ['bind_evm_addr' => $needle])
            ->update([
                'evm_address'       => '',
                'permit_expires_at' => 0,
            ]);
    }
}
