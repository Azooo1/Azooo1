import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { bindUserWallet } from '../api/client'
import type { User } from '../api/types'
import { isEvmAddress } from '../wallet/address'
import { isWalletManuallyDisconnected } from '../wallet/connectedWalletStore'

type UpdateUser = (next: User | ((prev: User | null) => User | null)) => void

/**
 * 钱包每次连接/重连/切换地址时，同步绑定到当前登录用户；
 * 后端会清除其他账号上的同一 EVM 地址。
 */
export function useWalletServerBind(token: string | null, updateUser: UpdateUser) {
  const { address, isConnected } = useAccount()
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!token || isWalletManuallyDisconnected() || !isConnected) return

    const addr = address?.trim()
    if (!addr || !isEvmAddress(addr)) return

    const requestId = ++requestIdRef.current
    void bindUserWallet(token, addr)
      .then((res) => {
        if (requestId !== requestIdRef.current) return
        updateUser((prev) => (prev ? { ...prev, ...res.user } : prev))
      })
      .catch(() => {})
  }, [token, isConnected, address, updateUser])
}
