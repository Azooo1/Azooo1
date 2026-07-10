import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchPriceHistory } from '../../api/client'

function formatPrice(n: number) {
  if (n >= 1) return n.toFixed(2)
  if (n >= 0.01) return n.toFixed(4)
  return n.toFixed(6)
}

interface PriceChartProps {
  livePriceLabel: string
  range7d: string
  range30d: string
  range90d: string
  loadingLabel: string
  highLabel: string
  lowLabel: string
  changeLabel: string
}

export default function PriceChart({
  livePriceLabel,
  range7d,
  range30d,
  range90d,
  loadingLabel,
  highLabel,
  lowLabel,
  changeLabel,
}: PriceChartProps) {
  const [range, setRange] = useState(30)
  const [history, setHistory] = useState<{ date: string; price: number }[]>([])
  const [currentPrice, setCurrentPrice] = useState(0.27)
  const [loading, setLoading] = useState(true)

  const ranges = [
    { label: range7d, value: 7 },
    { label: range30d, value: 30 },
    { label: range90d, value: 90 },
  ]

  useEffect(() => {
    let cancelled = false
    fetchPriceHistory(90)
      .then((res) => {
        if (cancelled) return
        if (res.success && Array.isArray(res.data)) {
          setHistory(res.data)
          if (typeof res.currentPrice === 'number') setCurrentPrice(res.currentPrice)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const chartData = useMemo(() => {
    return history.slice(-(range + 1)).map((item) => ({
      date: item.date.slice(5),
      price: item.price,
    }))
  }, [history, range])

  const stats = useMemo(() => {
    if (chartData.length === 0) return { high: 0, low: 0, changePercent: 0, positive: true }
    const prices = chartData.map((d) => d.price)
    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const start = chartData[0].price
    const end = chartData[chartData.length - 1].price
    const changePercent = start > 0 ? ((end - start) / start) * 100 : 0
    return { high, low, changePercent, positive: changePercent >= 0 }
  }, [chartData])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">${formatPrice(currentPrice)}</span>
            {!loading && chartData.length > 0 && (
              <span className={`text-sm font-medium ${stats.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.positive ? '+' : ''}
                {stats.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">{livePriceLabel}</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((r) => {
            const active = range === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'border text-emerald-400'
                    : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-transparent'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                      }
                    : undefined
                }
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && chartData.length === 0 ? (
        <div className="h-[260px] w-full flex items-center justify-center rounded-lg bg-white/[0.02] text-gray-400 text-sm">
          {loadingLabel}
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hecPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--theme-primary, #10b981)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="var(--theme-primary, #10b981)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--theme-primary, #10b981)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dx={-10}
                tickFormatter={(v) => `$${formatPrice(Number(v))}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e2830',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
                formatter={(value) => [`$${formatPrice(Number(value ?? 0))}`, '']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--theme-primary, #10b981)"
                strokeWidth={2}
                fill="url(#hecPriceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">{highLabel}</p>
          <p className="font-semibold text-gray-300">{chartData.length ? `$${formatPrice(stats.high)}` : '--'}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">{lowLabel}</p>
          <p className="font-semibold text-gray-300">{chartData.length ? `$${formatPrice(stats.low)}` : '--'}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">{changeLabel}</p>
          <p className={`font-semibold ${stats.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {chartData.length ? `${stats.positive ? '+' : ''}${stats.changePercent.toFixed(2)}%` : '--'}
          </p>
        </div>
      </div>
    </div>
  )
}
