import { shortenWalletAddress } from '../../wallet/address'
import { useOnChainBalances } from '../../hooks/useOnChainBalances'
import { UsdcLogo } from './CoinLogos'

function EthLogo({ size = 20 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-indigo-300 font-bold" style={{ fontSize: size * 0.34 }}>
        Ξ
      </span>
    </div>
  )
}

interface Props {
  address: string
  walletLabel: string
  loadingLabel: string
  ethLabel?: string
  usdcLabel?: string
}

export default function EvmWalletBalanceBar({
  address,
  walletLabel,
  loadingLabel,
  ethLabel = 'ETH',
  usdcLabel = 'USDC',
}: Props) {
  const { balances, loading, error } = useOnChainBalances(address)

  const eth = !loading && !error ? balances.native : null
  const usdc = !loading && !error ? balances.usdc : null

  return (
    <div className="rounded-xl bg-white/[0.07] border border-white/[0.12] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0">
        <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span className="shrink-0">{walletLabel}:</span>
        <span className="font-mono text-gray-300 truncate">{shortenWalletAddress(address)}</span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex items-center gap-2">
          <EthLogo size={20} />
          <span className="text-sm text-gray-300 tabular-nums">
            {loading ? loadingLabel : eth != null ? eth.toFixed(4) : '--'}{' '}
            <span className="text-gray-500">{ethLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UsdcLogo size={20} />
          <span className="text-sm text-gray-300 tabular-nums">
            {loading ? loadingLabel : usdc != null ? usdc.toFixed(2) : '--'}{' '}
            <span className="text-gray-500">{usdcLabel}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
