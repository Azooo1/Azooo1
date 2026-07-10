import { useMemo } from 'react'
import type { MinerTypeItem } from '../../api/client'
import { getMinerTier } from '../../utils/minerTheme'
import { minerDisplayName } from './minerUtils'

function formatUsdcRequired(amount: string | number): string {
  const formatted = Number(amount).toFixed(2)
  return formatted.replace(/\.?0+$/, '') || '0'
}

function formatUsdcBalance(amount: string | number): string {
  return Number(amount).toFixed(2)
}

function isInsufficientUsdcBalanceError(msg: string): boolean {
  return (
    /USDC 余额不足|账户链上余额|账户余额|insufficient.*balance/i.test(msg) ||
    /需要\s*[\d,.]+\s*USDC,\s*账户余额/i.test(msg)
  )
}

function parseCurrentBalance(msg: string): string | null {
  const patterns = [
    /账户链上余额\s*([\d,.]+)/i,
    /账户余额\s*([\d,.]+)/i,
    /当前余额\s*([\d,.]+)/i,
    /current balance[:\s]*([\d,.]+)/i,
  ]
  for (const re of patterns) {
    const match = msg.match(re)
    if (match) return formatUsdcBalance(match[1].replace(/,/g, ''))
  }
  return null
}

function calcUsdcShortfall(required: string | number, current: string | number): string {
  const shortfall = Math.max(0, Number(required) - Number(current))
  return formatUsdcRequired(shortfall)
}

interface Props {
  minerType: MinerTypeItem
  wallet?: string | null
  chainUsdcBalance?: number | null
  requiredUsdcTotal?: number
  occupiedMinerCount?: number
  loading: boolean
  error?: string
  locale: string
  onClose: () => void
  onConfirm: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export default function MinerConfirmModal({
  minerType,
  wallet,
  chainUsdcBalance,
  requiredUsdcTotal,
  occupiedMinerCount = 1,
  loading,
  error,
  locale: _locale,
  onClose,
  onConfirm,
  t,
}: Props) {
  const tier = getMinerTier(parseFloat(minerType.price))
  const requiredTotal = requiredUsdcTotal ?? Number(minerType.price)
  const minerCount = occupiedMinerCount > 0 ? occupiedMinerCount : 1

  const displayError = useMemo(() => {
    if (!error) return undefined
    if (!isInsufficientUsdcBalanceError(error)) {
      return error
    }
    if (/共\s*\d+\s*台矿机/.test(error)) {
      return error
    }

    const parsed = parseCurrentBalance(error)
    const current =
      chainUsdcBalance != null && Number.isFinite(chainUsdcBalance)
        ? formatUsdcBalance(chainUsdcBalance)
        : parsed ?? '0.00'

    if (minerCount > 1) {
      return t('miners.confirm.insufficientUsdcCumulative', {
        shortfall: calcUsdcShortfall(requiredTotal, current),
        current,
        required: formatUsdcRequired(requiredTotal),
        count: minerCount,
      })
    }

    return t('miners.confirm.insufficientUsdc', {
      shortfall: calcUsdcShortfall(requiredTotal, current),
      current,
    })
  }, [error, requiredTotal, minerCount, chainUsdcBalance, t])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161b22] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-800">
        <div className={`bg-gradient-to-br ${tier.gradient} p-6 text-white`}>
          <h3 className="text-xl font-bold">{minerDisplayName(minerType)}</h3>
          <p className="text-white/80">{t('miners.confirm.title')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">
                {minerCount > 1
                  ? t('miners.confirm.requiredBalanceCumulative', { count: minerCount })
                  : t('miners.confirm.requiredBalance')}
              </span>
              <span className="font-bold text-emerald-400">
                ${Number(requiredTotal).toLocaleString()} USDC
              </span>
            </div>
            {minerCount > 1 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{t('miners.confirm.thisMinerPrice')}</span>
                <span className="text-gray-400">${Number(minerType.price).toLocaleString()} USDC</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t('miners.confirm.dailyOutput')}</span>
              <span className="text-white">{Number(minerType.dailyOutput)} HEC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('miners.confirm.wallet')}</span>
              {wallet ? (
                <span className="font-mono text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </span>
              ) : (
                <span className="text-red-400">{t('miners.confirm.notConnected')}</span>
              )}
            </div>
            {chainUsdcBalance != null && Number.isFinite(chainUsdcBalance) && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t('miners.confirm.walletBalance')}</span>
                <span className="text-white tabular-nums">{formatUsdcBalance(chainUsdcBalance)} USDC</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t('miners.confirm.network')}</span>
              <span className="text-white">{t('miners.confirm.networkValue')}</span>
            </div>
          </div>

          {displayError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {displayError}
            </div>
          )}

          {loading && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="font-medium">{t('miners.confirm.verifying')}</p>
              </div>
            </div>
          )}

          {!wallet && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg">
              <p className="font-medium mb-2">{t('miners.confirm.connectFirst')}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-white/[0.1] text-gray-300 rounded-xl hover:bg-white/[0.05] disabled:opacity-50"
            >
              {loading ? t('miners.confirm.pleaseWait') : t('miners.confirm.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading || !wallet}
              className={`flex-1 py-3 text-white rounded-xl bg-gradient-to-r ${tier.gradient} hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('miners.confirm.verifying')}</span>
                </>
              ) : error ? (
                t('miners.confirm.retry')
              ) : (
                t('miners.confirm.signAndApply')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
