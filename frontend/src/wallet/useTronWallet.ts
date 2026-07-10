import { useCallback, useState } from 'react'
import { connectTronWalletAuto, connectTronWalletById } from './tronProviders'

export function useTronWalletConnect() {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const result = await connectTronWalletAuto()
      if (result.type === 'pick') {
        return await connectTronWalletById(result.wallets[0].id)
      }
      return result.address
    } catch (err) {
      const message = err instanceof Error ? err.message : '连接失败'
      setError(message)
      throw err
    } finally {
      setConnecting(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { connect, connecting, error, clearError }
}
