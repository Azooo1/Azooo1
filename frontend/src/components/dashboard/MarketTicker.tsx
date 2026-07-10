import { useEffect, useRef, useState } from 'react'
import { fetchMarketTicker, fetchPriceConfig } from '../../api/client'
import { getMarketTickerSocket, type TickerCache } from '../../api/marketTickerSocket'
import { COIN_COLORS, FALLBACK_TICKER } from '../../mock/market-ticker'

const COIN_ORDER = ['BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'TRX', 'DOGE', 'SUI', 'TON'] as const

interface TickerRow {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  isPlatformCoin?: boolean
}

function cacheToList(cache: TickerCache): Array<{ id: string; symbol: string; name: string; price: number; change24h: number }> {
  return COIN_ORDER.filter((s) => cache[s]).map((symbol) => ({
    id: symbol.toLowerCase(),
    symbol: cache[symbol].symbol,
    name: cache[symbol].name,
    price: cache[symbol].price,
    change24h: cache[symbol].change24h,
  }))
}

function buildRows(
  tickerData: Array<{ id: string; symbol: string; name: string; price: number; change24h: number }>,
  hecPrice: { currentPrice: number; trend: number },
): TickerRow[] {
  const map: Record<string, TickerRow> = {}
  for (const item of tickerData) {
    map[item.symbol] = { ...item }
  }

  const list: TickerRow[] = []
  for (const symbol of COIN_ORDER) {
    const item = map[symbol]
    if (item) list.push(item)
  }

  list.push({
    id: 'hec',
    symbol: 'HEC',
    name: 'HEC',
    price: hecPrice.currentPrice,
    change24h: Number((100 * hecPrice.trend).toFixed(2)) || 0,
    isPlatformCoin: true,
  })

  return list
}

function formatPrice(price: number) {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (price >= 1) return price.toFixed(2)
  if (price >= 0.01) return price.toFixed(4)
  return price.toFixed(6)
}

function CoinIcon({ symbol, isPlatformCoin }: { symbol: string; isPlatformCoin?: boolean }) {
  if (isPlatformCoin) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{
          background: 'var(--theme-primary)',
          boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary) 40%, transparent)',
        }}
      >
        {symbol.charAt(0)}
      </div>
    )
  }

  const colors = COIN_COLORS[symbol]
  const isGradient = colors?.bg.includes('gradient')

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ background: colors?.bg || '#666', color: colors?.text || '#fff' }}
    >
      <span className={isGradient ? 'text-white' : undefined}>{symbol.charAt(0)}</span>
    </div>
  )
}

function PriceValue({ price }: { price: number }) {
  const prev = useRef(price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    const last = prev.current
    if (last !== price && last > 0) {
      setFlash(price > last ? 'up' : 'down')
      const timer = setTimeout(() => setFlash(null), 800)
      prev.current = price
      return () => clearTimeout(timer)
    }
    prev.current = price
  }, [price])

  return (
    <span
      className={`text-sm font-semibold tabular-nums transition-colors duration-300 ${
        flash === 'up' ? 'text-emerald-400' : flash === 'down' ? 'text-red-400' : 'text-white'
      }`}
      style={{
        display: 'inline-block',
        transform: flash === 'up' ? 'translateY(-1px)' : flash === 'down' ? 'translateY(1px)' : 'none',
      }}
    >
      {formatPrice(price)}
    </span>
  )
}

function ChangeBadge({ change }: { change: number }) {
  const positive = change > 0
  const negative = change < 0

  return (
    <span
      className={`text-xs font-medium tabular-nums flex items-center gap-0.5 ${
        positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-gray-400'
      }`}
    >
      {positive ? '+' : ''}
      {change}%
      {positive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : negative ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      ) : null}
    </span>
  )
}

export default function MarketTicker() {
  const [rows, setRows] = useState<TickerRow[]>([])
  const [loading, setLoading] = useState(true)
  const hecPriceRef = useRef({ currentPrice: 0.27, trend: 0.002 })

  useEffect(() => {
    let cancelled = false

    const applyRows = (tickerData: Array<{ id: string; symbol: string; name: string; price: number; change24h: number }>) => {
      if (cancelled) return
      setRows(buildRows(tickerData, hecPriceRef.current))
      setLoading(false)
    }

    const fetchHecPrice = async () => {
      const priceRes = await fetchPriceConfig()
      if (cancelled) return
      if (priceRes.success && priceRes.data) {
        hecPriceRef.current = priceRes.data
        setRows((prev) => {
          if (prev.length === 0) return prev
          return buildRows(
            prev.filter((r) => !r.isPlatformCoin).map((r) => ({
              id: r.id,
              symbol: r.symbol,
              name: r.name,
              price: r.price,
              change24h: r.change24h,
            })),
            hecPriceRef.current,
          )
        })
      }
    }

    const fetchRestTicker = async () => {
      const tickerRes = await fetchMarketTicker()
      if (cancelled) return
      const tickerData =
        tickerRes.success && tickerRes.data?.length ? tickerRes.data : FALLBACK_TICKER
      applyRows(tickerData)
    }

    const socket = getMarketTickerSocket()

    const unsubscribe = socket.onUpdate((cache) => {
      const list = cacheToList(cache)
      if (list.length > 0) {
        applyRows(list)
      }
    })

    // 初始 REST 拉取
    Promise.all([fetchRestTicker(), fetchHecPrice()])

    // WS 未连接时每 5 秒轮询；已连接时由 ticker_update 实时推送
    const pollInterval = setInterval(() => {
      if (!socket.isConnected()) {
        fetchRestTicker()
      }
    }, 5000)

    const hecInterval = setInterval(fetchHecPrice, 30_000)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(pollInterval)
      clearInterval(hecInterval)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse bg-white/[0.03]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            row.isPlatformCoin
              ? 'bg-white/[0.05] border border-emerald-500/30'
              : 'bg-white/[0.03] hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <CoinIcon symbol={row.symbol} isPlatformCoin={row.isPlatformCoin} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white">{row.symbol}</span>
            <span className="text-xs ml-1 text-gray-500">({row.symbol}/U.S. Dollar)</span>
          </div>
          <div className="text-right flex items-center gap-3 flex-shrink-0">
            <PriceValue price={row.price} />
            <ChangeBadge change={row.change24h} />
          </div>
        </div>
      ))}
    </div>
  )
}
