import { useCallback, useState } from 'react'
import { useConnect, useDisconnect } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import {
  clearWalletManuallyDisconnected,
  notifyWalletConnected,
} from './connectedWalletStore'
import { mapWalletConnectError } from './rpcError'

function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /user rejected|user denied|User rejected|User denied|cancel|拒绝|取消/i.test(msg)
}

export function useEvmWalletConnect(onConnected?: (address: string) => void) {
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [localError, setLocalError] = useState<string | null>(null)

  const connectInjected = useCallback(async () => {
    setLocalError(null)
    clearWalletManuallyDisconnected()
    const injected =
      connectors.find((item) => item.id === 'injected') ??
      connectors.find((item) => item.type === 'injected') ??
      connectors[0]
    if (!injected) {
      setLocalError('no-evm-wallet')
      throw new Error('no-evm-wallet')
    }
    try {
      const result = await connectAsync({ connector: injected, chainId: mainnet.id })
      const address = result.accounts[0]
      if (address) {
        notifyWalletConnected(address)
        onConnected?.(address)
      }
      return address
    } catch (err) {
      if (isUserRejected(err)) {
        setLocalError('user-rejected')
      } else {
        setLocalError(mapWalletConnectError(err))
      }
      throw err
    }
  }, [connectAsync, connectors, onConnected])

  const connectWalletConnect = useCallback(
    async (onUri?: (uri: string) => void) => {
      setLocalError(null)
      clearWalletManuallyDisconnected()
      const wc = connectors.find((item) => item.type === 'walletConnect')
      if (!wc) {
        setLocalError('missing-project-id')
        throw new Error('missing-project-id')
      }

      const provider = (await wc.getProvider()) as {
        session?: unknown
        on?: (event: string, listener: (uri: string) => void) => void
        removeListener?: (event: string, listener: (uri: string) => void) => void
        disconnect?: () => Promise<void>
      }
      const onDisplayUri = (uri: string) => onUri?.(uri)
      provider?.on?.('display_uri', onDisplayUri)

      try {
        // 清理异常残留会话，避免 init/connect 卡死或立即失败
        if (provider?.session) {
          await provider.disconnect?.().catch(() => {})
        }
        const result = await connectAsync({ connector: wc, chainId: mainnet.id })
        const address = result.accounts[0]
        if (address) {
          notifyWalletConnected(address)
          onConnected?.(address)
        }
        return address
      } catch (err) {
        if (isUserRejected(err)) {
          setLocalError('user-rejected')
        } else {
          setLocalError(mapWalletConnectError(err))
        }
        throw err
      } finally {
        provider?.removeListener?.('display_uri', onDisplayUri)
      }
    },
    [connectAsync, connectors, onConnected],
  )

  const disconnect = useCallback(async () => {
    await disconnectAsync().catch(() => {})
  }, [disconnectAsync])

  return {
    connectInjected,
    connectWalletConnect,
    disconnect,
    connecting: isPending,
    error: localError,
    errorCode: localError === 'no-evm-wallet' ? 'no-evm-wallet' : null,
  }
}
