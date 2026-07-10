import type { UserMiner } from '../../api/types'
import { glowColor, getMinerTier } from '../../utils/minerTheme'
import type { LiveMetrics } from '../../mock/miner-metrics'
import MinerImage from './MinerImage'

interface Props {
  miner: UserMiner | null
  metrics: LiveMetrics
  t: (key: string) => string
}

const TIER_LABELS: Record<string, string> = {
  'from-blue-500 to-cyan-500': 'Basic',
  'from-purple-500 to-pink-500': 'Pro',
  'from-amber-500 to-orange-500': 'Elite',
}

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${color}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  )
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  color,
  active,
}: {
  label: string
  value: string
  unit: string
  icon: React.ReactNode
  color: string
  active: boolean
}) {
  return (
    <div
      className={`relative rounded-xl border px-3.5 py-3 transition-all duration-300 ${
        active
          ? 'bg-white/[0.04] border-white/[0.08] shadow-sm'
          : 'bg-white/[0.02] border-white/[0.04] opacity-50'
      }`}
    >
      {active && (
        <div
          className="absolute -top-3 -left-3 w-10 h-10 rounded-full blur-2xl pointer-events-none"
          style={{ background: color.replace('text-', '').replace('bg-', '') + '20' }}
        />
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">{label}</p>
          <p className={`font-mono font-bold text-lg tabular-nums leading-none transition-colors duration-300 ${active ? color : 'text-gray-500'}`}>
            {value}
            <span className="text-[10px] text-gray-600 ml-1 font-medium">{unit}</span>
          </p>
        </div>
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          active ? 'bg-white/[0.05]' : 'bg-white/[0.02]'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function HashIcon() {
  return (
    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}
function TempIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function FanIcon() {
  return (
    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
function PowerIcon() {
  return (
    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

export default function MinerPreviewPanel({ miner, metrics, t }: Props) {
  const running = miner?.status === 'RUNNING'
  const pending = miner?.status === 'PENDING'
  const stopped = miner && !running && !pending
  const tier = miner ? getMinerTier(parseFloat(miner.minerType.price)) : getMinerTier(300)

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/[0.08] overflow-hidden transition-all duration-500 hover:border-white/[0.15] hover:shadow-[0_0_40px_rgba(16,185,129,0.06)]">

      {/* ==================== 标题栏 ==================== */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3.5 bg-black/30 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70 shadow-sm shadow-red-500/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 shadow-sm shadow-yellow-500/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 shadow-sm shadow-green-500/20" />
          </div>
          <span className="text-[11px] text-gray-500 font-medium tracking-widest uppercase">
            {t('miners.display.preview')}
          </span>
          {miner && (
            <>
              <span className="text-gray-700 text-[10px]">/</span>
              <span className="text-sm text-white font-semibold truncate max-w-[160px]">
                {miner.minerType.name}
              </span>
              <span
                className="hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                style={{
                  backgroundColor: tier.gradient + '18',
                  color: tier.gradient.split(' ').pop()?.replace('to-', '') || '#fff',
                }}
              >
                {TIER_LABELS[tier.gradient] || 'Basic'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {running && (
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/15 shadow-sm shadow-emerald-500/5">
              <PulseDot color="bg-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-bold tracking-[0.15em]">MINING</span>
            </div>
          )}
          {pending && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/15">
              <PulseDot color="bg-amber-400" />
              <span className="text-amber-400 text-[10px] font-bold tracking-[0.15em]">PENDING</span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 主体区域 ==================== */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: miner ? '320px' : '280px' }}
      >
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {miner ? (
          <div className="relative h-full flex flex-col lg:flex-row items-center justify-center gap-6 px-6 py-6">
            {/* ──── 左侧：矿机图像 ──── */}
            <div className={`relative flex-shrink-0 transition-all duration-700 ${
              running ? 'scale-100 opacity-100' : 'scale-[0.85] opacity-40 grayscale'
            }`}>
              {running && (
                <div
                  className="absolute inset-0 rounded-full blur-[60px] animate-pulse pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${glowColor(tier.gradient)}35 0%, transparent 70%)`,
                    transform: 'scale(1.8)',
                  }}
                />
              )}
              <div className={`relative ${running ? 'drop-shadow-[0_0_40px_rgba(52,211,153,0.25)]' : ''}`}>
                <MinerImage
                  minerTypeId={miner.minerTypeId}
                  price={parseFloat(miner.minerType.price)}
                  image={miner.minerType.image}
                  className="h-56 w-56 sm:h-64 sm:w-64 object-contain mx-auto"
                />
              </div>
              {running && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
                  <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent animate-scan-top" />
                </div>
              )}
            </div>

            {/* ──── 右侧：Hero 数据 ──── */}
            {running && (
              <div className="flex flex-col items-center lg:items-start gap-4 flex-shrink-0">
                <div className="text-center lg:text-left">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1.5">
                    {t('miners.card.hashRate')}
                  </p>
                  <p className="font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 text-5xl sm:text-6xl tabular-nums leading-none drop-shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                    {metrics.hashrate.toFixed(0)}
                    <span className="text-lg sm:text-xl text-gray-400 ml-2 font-semibold align-baseline">H/s</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.05] rounded-lg px-3 py-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${metrics.temperature > 75 ? 'bg-orange-400 animate-pulse' : 'bg-cyan-400'}`} />
                    <span className={`text-xs font-mono tabular-nums font-medium ${metrics.temperature > 75 ? 'text-orange-400' : 'text-cyan-400'}`}>
                      {metrics.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.05] rounded-lg px-3 py-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-400 font-mono tabular-nums">
                      {miner.startedAt
                        ? (() => {
                            const diff = Math.floor((Date.now() - new Date(miner.startedAt).getTime()) / 1000)
                            const h = Math.floor(diff / 3600)
                            const m = Math.floor((diff % 3600) / 60)
                            return `${h}h ${m}m`
                          })()
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center transition-all duration-300 group-hover:scale-105">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p className="text-base text-gray-500 font-medium">{t('miners.display.selectToView')}</p>
            </div>
          </div>
        )}

        {stopped && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[3px] z-20">
            <div className="bg-black/60 backdrop-blur-lg px-6 py-3 rounded-xl border border-white/[0.06] shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-gray-200 font-medium text-sm tracking-wide">{t('miners.status.stopped')}</span>
              </div>
            </div>
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[3px] z-20">
            <div className="bg-amber-500/10 backdrop-blur-lg px-6 py-3 rounded-xl border border-amber-500/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-amber-300 font-medium text-sm tracking-wide">{t('miners.status.pending')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 底部 2x2 指标卡片 ==================== */}
      {miner && (
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 py-4 bg-black/40 border-t border-white/[0.06] backdrop-blur-sm">
          <MetricCard
            label={t('miners.card.hashRate')}
            value={running ? metrics.hashrate.toFixed(0) : '--'}
            unit="H/s"
            icon={<HashIcon />}
            color="text-cyan-400"
            active={running}
          />
          <MetricCard
            label={t('miners.card.temperature')}
            value={running ? metrics.temperature.toFixed(1) : '--'}
            unit="°C"
            icon={<TempIcon />}
            color={running && metrics.temperature > 75 ? 'text-orange-400' : 'text-emerald-400'}
            active={running}
          />
          <MetricCard
            label={t('miners.card.fanSpeed')}
            value={running ? metrics.fanSpeed.toFixed(0) : '--'}
            unit="RPM"
            icon={<FanIcon />}
            color="text-blue-400"
            active={running}
          />
          <MetricCard
            label={t('miners.card.power')}
            value={running ? metrics.power.toFixed(0) : '--'}
            unit="W"
            icon={<PowerIcon />}
            color="text-amber-400"
            active={running}
          />
        </div>
      )}
    </div>
  )
}
