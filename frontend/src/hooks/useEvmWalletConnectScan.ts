import { useCallback, useRef, useState } from 'react'
import { useEvmWalletConnect } from '../wallet/useEvmWalletConnect'
import { mapWalletConnectError } from '../wallet/rpcError'

function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /user rejected|user denied|cancel|拒绝|取消/i.test(msg)
}

export function useEvmWalletConnectScan(onConnected?: (address: string) => void) {
  const wallet = useEvmWalletConnect(onConnected)
  const [open, setOpen] = useState(false)
  const [uri, setUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeRef = useRef(false)

  const close = useCallback(() => {
    if (activeRef.current) return
    setOpen(false)
    setUri(null)
    setError(null)
  }, [])

  const connectScan = useCallback(async () => {
    setOpen(true)
    setUri(null)
    setError(null)
    activeRef.current = true
    try {
      const address = await wallet.connectWalletConnect((nextUri) => setUri(nextUri))
      setOpen(false)
      setUri(null)
      return address
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isUserRejected(err)) {
        setError('user-rejected')
      } else if (msg === 'missing-project-id') {
        setError('missing-project-id')
      } else {
        setError(mapWalletConnectError(err))
      }
      return null
    } finally {
      activeRef.current = false
    }
  }, [wallet])

  return {
    open,
    uri,
    error,
    connecting: wallet.connecting,
    connectScan,
    close,
    retry: connectScan,
  }
}
