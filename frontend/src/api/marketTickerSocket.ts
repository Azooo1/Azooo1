export interface TickerCacheItem {
  symbol: string
  name: string
  price: number
  change24h: number
  high?: number
  low?: number
  volume?: number
}

export type TickerCache = Record<string, TickerCacheItem>

type TickerListener = (data: TickerCache) => void

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL as string
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  if (import.meta.env.DEV) {
    return `${proto}//${window.location.host}/ws`
  }
  return 'wss://hecminai.cloud/ws'
}

class MarketTickerSocket {
  private ws: WebSocket | null = null
  private callbacks = new Set<TickerListener>()
  private cache: TickerCache = {}
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 10
  private isConnecting = false
  private disposed = false

  connect() {
    if (this.disposed || this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return

    this.isConnecting = true
    const url = getWsUrl()

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { action?: string; data?: TickerCache }
          if (msg.action === 'ping') {
            this.ws?.send(JSON.stringify({ action: 'pong' }))
            return
          }
          if (msg.action === 'ticker_update' && msg.data) {
            this.cache = msg.data
            this.callbacks.forEach((cb) => cb(msg.data!))
          }
        } catch {
          // ignore malformed frames
        }
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.ws = null
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.isConnecting = false
      }
    } catch {
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.disposed || this.reconnectAttempts >= this.maxReconnectAttempts) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  onUpdate(listener: TickerListener) {
    this.callbacks.add(listener)
    if (Object.keys(this.cache).length > 0) {
      listener(this.cache)
    }
    this.connect()
    return () => {
      this.callbacks.delete(listener)
    }
  }

  getCachedData() {
    return this.cache
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  reconnect() {
    this.reconnectAttempts = 0
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connect()
  }

  dispose() {
    this.disposed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.callbacks.clear()
    this.cache = {}
  }
}

let singleton: MarketTickerSocket | null = null

export function getMarketTickerSocket() {
  if (!singleton) {
    singleton = new MarketTickerSocket()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          singleton?.reconnect()
        }
      })
    }
  }
  return singleton
}

export function isMarketTickerWsConnected() {
  return singleton?.isConnected() ?? false
}
