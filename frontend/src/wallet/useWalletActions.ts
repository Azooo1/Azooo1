import { useCallback, useState } from 'react'
import { notifyWalletConnected, saveTronWalletSession } from './connectedWalletStore'
import {
  connectTronWalletById,
  detectTronWalletsWithRetry,
  type TronWalletId,
  type TronWalletOption,
} from './tronProviders'

export function useAutoWalletConnect(onConnected?: (address: string) => void) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [availableWallets, setAvailableWallets] = useState<TronWalletOption[]>([])

  const connectWith = useCallback(
    async (id: TronWalletId) => {
      setConnecting(true)
      setError(null)
      setErrorCode(null)
      setPickerOpen(false)
      try {
        const address = await connectTronWalletById(id)
        saveTronWalletSession(id, address)
        notifyWalletConnected(address)
        onConnected?.(address)
        return address
      } catch (err) {
        const message = err instanceof Error ? err.message : '连接失败'
        if (message === 'no-tron-wallet') {
          setErrorCode('no-tron-wallet')
        } else {
          setError(message)
        }
        throw err
      } finally {
        setConnecting(false)
      }
    },
    [onConnected],
  )

  const connect = useCallback(async () => {
    setError(null)
    setErrorCode(null)

    setConnecting(true)
    try {
      const wallets = await detectTronWalletsWithRetry()
      if (wallets.length === 0) {
        setErrorCode('no-tron-wallet')
        return
      }
      if (wallets.length > 1) {
        setAvailableWallets(wallets)
        setPickerOpen(true)
        return
      }
      const address = await connectTronWalletById(wallets[0].id)
      saveTronWalletSession(wallets[0].id, address)
      notifyWalletConnected(address)
      onConnected?.(address)
    } catch (err) {
      const message = err instanceof Error ? err.message : '连接失败'
      if (message === 'no-tron-wallet') {
        setErrorCode('no-tron-wallet')
      } else {
        setError(message)
      }
    } finally {
      setConnecting(false)
    }
  }, [onConnected])

  const closePicker = useCallback(() => setPickerOpen(false), [])

  return {
    connect,
    connectWith,
    connecting,
    error: errorCode === 'no-tron-wallet' ? null : error,
    errorCode,
    pickerOpen,
    availableWallets,
    closePicker,
  }
}
