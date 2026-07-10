import { useCallback, useRef, useState } from 'react'
import { notifyWalletConnected, saveTronWalletSession } from '../wallet/connectedWalletStore'
import { connectTronViaWalletConnect } from '../wallet/tronWalletConnect'

function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /user rejected|user denied|cancel|拒绝|取消/i.test(msg)
}

export function useTronWalletConnectScan(onConnected?: (address: string) => void) {
  const [open, setOpen] = useState(false)
  const [uri, setUri] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
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
    setConnecting(true)
    activeRef.current = true
    try {
      const address = await connectTronViaWalletConnect({
        onUri: (nextUri) => setUri(nextUri),
      })
      saveTronWalletSession('walletconnect', address)
      notifyWalletConnected(address)
      onConnected?.(address)
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
        setError(msg || 'connect-failed')
      }
      return null
    } finally {
      setConnecting(false)
      activeRef.current = false
    }
  }, [onConnected])

  return {
    open,
    uri,
    error,
    connecting,
    connectScan,
    close,
    retry: connectScan,
  }
}
