export const FALLBACK_TICKER = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 64900, change24h: 1.35 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 1765.11, change24h: 2.68 },
  { id: 'tether', symbol: 'USDT', name: 'Tether', price: 0.9999, change24h: 0 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 1.15, change24h: 0.65 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 599.25, change24h: 1.93 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 74.33, change24h: 1.77 },
  { id: 'tron', symbol: 'TRX', name: 'TRON', price: 0.332, change24h: 1.55 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.0845, change24h: 1.08 },
  { id: 'sui', symbol: 'SUI', name: 'Sui', price: 0.7692, change24h: 3.82 },
  { id: 'ton', symbol: 'TON', name: 'Toncoin', price: 1.67, change24h: -0.27 },
] 

export const COIN_COLORS: Record<string, { bg: string; text: string }> = {
  BTC: { bg: '#F7931A', text: '#fff' },
  ETH: { bg: '#627EEA', text: '#fff' },
  USDT: { bg: '#26A17B', text: '#fff' },
  XRP: { bg: '#23292F', text: '#fff' },
  BNB: { bg: '#F3BA2F', text: '#1E2026' },
  SOL: { bg: 'linear-gradient(135deg, #9945FF, #14F195)', text: '#fff' },
  TRX: { bg: '#EF0027', text: '#fff' },
  DOGE: { bg: '#C2A633', text: '#fff' },
  SUI: { bg: '#4DA2FF', text: '#fff' },
  TON: { bg: '#0098EA', text: '#fff' },
}
