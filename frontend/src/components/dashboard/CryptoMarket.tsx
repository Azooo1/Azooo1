const MARKET_DATA = [
  { symbol: 'BTC', price: '$98,432', change: '+2.14%', up: true },
  { symbol: 'ETH', price: '$3,456', change: '+1.82%', up: true },
  { symbol: 'SOL', price: '$186.20', change: '+3.25%', up: true },
  { symbol: 'BNB', price: '$621.50', change: '+0.94%', up: true },
]

interface CryptoMarketProps {
  title: string
  coins: { symbol: string; name: string }[]
}

export default function CryptoMarket({ title, coins }: CryptoMarketProps) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
      <h2 className="text-white font-semibold mb-4">{title}</h2>
      <div className="space-y-3">
        {coins.map((coin, i) => {
          const data = MARKET_DATA[i]
          return (
            <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-emerald-400">
                  {coin.symbol.slice(0, 1)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{coin.symbol}</div>
                  <div className="text-gray-600 text-xs">{coin.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white text-sm font-medium">{data.price}</div>
                <div className={`text-xs ${data.up ? 'text-emerald-400' : 'text-red-400'}`}>{data.change}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
