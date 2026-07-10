import { useCallback, useMemo } from 'react'
import { erc20Abi, formatEther, formatUnits, type Address } from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import { isEvmAddress } from '../wallet/address'
import { ETH_CHAIN_ID, ETH_USDC_CONTRACT } from '../wallet/config'
import { mapEvmRpcError } from '../wallet/rpcError'

export type OnChainChain = 'EVM'

export interface OnChainBalances {
  native: number
  usdt: number
  usdc: number
  nativeSymbol: 'ETH'
  chain: OnChainChain
}

const EMPTY: OnChainBalances = {
  native: 0,
  usdt: 0,
  usdc: 0,
  nativeSymbol: 'ETH',
  chain: 'EVM',
}

const balanceQuery = (enabled: boolean, refreshMs: number) => ({
  enabled,
  refetchInterval: refreshMs,
  refetchIntervalInBackground: true,
})

export function useOnChainBalances(address: string | null | undefined, refreshMs = 30_000) {
  const wallet = address && isEvmAddress(address) ? (address as Address) : undefined
  const enabled = Boolean(wallet)

  const {
    data: ethData,
    isPending: ethPending,
    error: ethError,
    refetch: refetchEth,
  } = useBalance({
    address: wallet,
    chainId: ETH_CHAIN_ID,
    query: balanceQuery(enabled, refreshMs),
  })

  const {
    data: usdcData,
    isPending: usdcPending,
    error: usdcError,
    refetch: refetchUsdc,
  } = useReadContract({
    address: ETH_USDC_CONTRACT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: wallet ? [wallet] : undefined,
    chainId: ETH_CHAIN_ID,
    query: balanceQuery(enabled, refreshMs),
  })

  const hasError = Boolean(ethError || usdcError)
  const error = hasError ? mapEvmRpcError(ethError ?? usdcError) : null

  const balances = useMemo((): OnChainBalances => {
    if (!enabled || hasError) return EMPTY

    const usdc = usdcData !== undefined ? Number(formatUnits(usdcData, 6)) : 0

    return {
      native: ethData ? Number(formatEther(ethData.value)) : 0,
      usdt: usdc,
      usdc,
      nativeSymbol: 'ETH',
      chain: 'EVM',
    }
  }, [enabled, hasError, ethData, usdcData])

  const loading = enabled && (ethPending || usdcPending)

  const refresh = useCallback(async () => {
    if (!enabled) return
    await Promise.all([refetchEth(), refetchUsdc()])
  }, [enabled, refetchEth, refetchUsdc])

  return { balances, loading, error, refresh }
}
