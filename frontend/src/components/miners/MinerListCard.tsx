import { useEffect, useState } from 'react'
import type { UserMiner } from '../../api/types'
import { getMinerTier } from '../../utils/minerTheme'
import type { LiveMetrics } from '../../mock/miner-metrics'
import { initialMetrics, jitterMetrics } from '../../mock/miner-metrics'
import {
  expiryLevel,
  formatExpiry,
  formatRuntime,
  minerDisplayName,
  statusLabel,
  toNumber,
} from './minerUtils'

interface Props {
  miner: UserMiner
  isSelected: boolean
  isRunning: boolean
  loading: boolean
  locale: string
  coinSymbol: string
  onSelect: () => void
  onAction: (action: 'start' | 'stop') => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export default function MinerListCard({
  miner,
  isSelected,
  isRunning,
  loading,
  locale: _locale,
  coinSymbol,
  onSelect,
  onAction,
  t,
}: Props) {
  const [live, setLive] = useState<LiveMetrics | null>(null)

  const price = parseFloat(miner.minerType.price)
  const tier = getMinerTier(price)
  const expired = miner.status === 'EXPIRED'
  const level = miner.expiresAt ? expiryLevel(miner.expiresAt) : 'safe'
  const canStart = (miner.status === 'APPROVED' || miner.status === 'STOPPED') && level !== 'expired'
  const canStop = miner.status === 'RUNNING'

  useEffect(() => {
    if (!isRunning) {
      setLive(null)
      return
    }
    setLive(initialMetrics(miner))
    const tick = () => setLive(jitterMetrics(miner))
    tick()
    const timer = setInterval(tick, 1000 + Math.random() * 800)
    return () => clearInterval(timer)
  }, [isRunning, miner.id, miner.minerType.dailyOutput, miner.minerType.price])

  const expiryClass =
    level === 'danger'
      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
      : level === 'warning'
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-white/[0.03] text-gray-500 border border-white/[0.06]'

  const borderClass = isSelected
    ? 'border-emerald-500/70 bg-emerald-500/[0.06] shadow-[0_0_24px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50 miner-card-selected'
    : isRunning
      ? 'border-emerald-500/25 bg-white/[0.03] shadow-[0_0_12px_rgba(16,185,129,0.08)]'
      : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.04]'

  const statusTextClass =
    miner.status === 'RUNNING'
      ? 'text-emerald-400'
      : miner.status === 'STOPPED'
        ? 'text-gray-500'
        : 'text-gray-400'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${borderClass}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${tier.gradient}`} />

      <div className="flex items-center justify-between mb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-gray-500'} ${isRunning ? 'animate-pulse' : ''}`}
            />
            {isRunning && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
            )}
          </div>
          <h4 className="font-semibold text-white">{minerDisplayName(miner.minerType)}</h4>
        </div>
        <span className={`text-xs font-medium ${statusTextClass}`}>{statusLabel(miner.status, t)}</span>
      </div>

      {miner.expiresAt && !expired && (
        <div className={`mb-3 px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${expiryClass}`}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('miners.expiry.remaining')}: {formatExpiry(miner.expiresAt, t)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">{t('miners.card.hashRate')}</p>
          <p
            className={`font-bold tabular-nums transition-all duration-300 ${
              isRunning && live ? 'text-orange-400' : 'text-white'
            }`}
          >
            {isRunning && live ? `${live.hashrate.toFixed(0)} H/s` : '-- H/s'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">{t('miners.card.temperature')}</p>
          <p
            className={`font-bold tabular-nums transition-all duration-300 ${
              isRunning && live
                ? live.temperature > 75
                  ? 'text-red-400'
                  : 'text-orange-400'
                : 'text-white'
            }`}
          >
            {isRunning && live ? `${live.temperature.toFixed(1)}°C` : '--°C'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">{t('miners.card.totalProfit')}</p>
          <p className="font-bold text-emerald-400 tabular-nums">
            {toNumber(miner.totalMined).toFixed(2)} {coinSymbol}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">{t('miners.card.runtime')}</p>
          <p className="font-bold text-white tabular-nums">{formatRuntime(miner.startedAt)}</p>
        </div>
      </div>

      {miner.status === 'STOPPED' && miner.stopReason === 'INSUFFICIENT_BALANCE' && (
        <div className="mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t('miners.status.stoppedInsufficientBalance')}
          </p>
        </div>
      )}

      {(canStart || canStop) && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
          {canStart && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction('start')}
              className={`w-full py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${tier.gradient} hover:opacity-90 disabled:opacity-50`}
            >
              {loading ? t('miners.card.processing') : t('miners.card.start')}
            </button>
          )}
          {canStop && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction('stop')}
              className="w-full py-2 rounded-lg text-sm font-medium text-gray-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-50"
            >
              {loading ? t('miners.card.processing') : t('miners.card.stop')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
