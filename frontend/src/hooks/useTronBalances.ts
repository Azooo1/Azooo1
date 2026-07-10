import { useCallback, useEffect, useState } from 'react'
import { isTronAddress } from '../wallet/address'
import { fetchTronBalances, type TronBalances } from '../wallet/tronBalances'

const EMPTY: TronBalances = { trx: 0, usdt: 0 }

export function useTronBalances(address: string | null | undefined, refreshMs = 30_000) {
  const [balances, setBalances] = useState<TronBalances>(EMPTY)
  const [loading, setLoading] = useState(() => Boolean(address && isTronAddress(address)))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!address || !isTronAddress(address)) {
      setBalances(EMPTY)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTronBalances(address)
      setBalances(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '余额获取失败')
      setBalances(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    refresh()
    if (!address || !isTronAddress(address)) return
    const timer = setInterval(refresh, refreshMs)
    return () => clearInterval(timer)
  }, [address, refresh, refreshMs])

  return { balances, loading, error, refresh }
}
