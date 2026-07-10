import { useEffect } from 'react'
import type { User } from '../api/types'
import { isEvmAddress } from '../wallet/address'
import { isWalletManuallyDisconnected, notifyWalletConnected } from '../wallet/connectedWalletStore'

function sameWalletAddress(a?: string | null, b?: string | null): boolean {
  const left = a?.trim().toLowerCase()
  const right = b?.trim().toLowerCase()
  return Boolean(left && right && left === right)
}

type UpdateUser = (next: User | ((prev: User | null) => User | null)) => void

/** 同步 wagmi 已连接地址到用户资料 */
export function useWalletAddressSync(
  user: User | null,
  updateUser: UpdateUser,
  connectedAddress?: string | null,
) {
  useEffect(() => {
    if (!user) return
    if (isWalletManuallyDisconnected()) {
      if (user.evmAddress) {
        updateUser((prev) => (prev && prev.evmAddress ? { ...prev, evmAddress: null } : prev))
      }
      return
    }

    const addr = connectedAddress?.trim()
    if (!addr || !isEvmAddress(addr)) return

    updateUser((prev) => {
      if (!prev || sameWalletAddress(prev.evmAddress, addr)) return prev
      return { ...prev, evmAddress: addr }
    })
  }, [user?.id, user?.evmAddress, connectedAddress, updateUser, user])

  useEffect(() => {
    if (!user || isWalletManuallyDisconnected()) return
    const addr = connectedAddress?.trim()
    if (addr && isEvmAddress(addr) && !sameWalletAddress(user.evmAddress, addr)) {
      notifyWalletConnected(addr)
    }
  }, [user?.id, connectedAddress, user?.evmAddress, user])
}
