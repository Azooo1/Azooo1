export interface LiveActivity {
  id: string
  user: string
  type: 'withdrawal' | 'deposit'
  amount: number
  createdAt: number
}

export const LIVE_ACTIVITIES_SEED = [
  { user: 'us***4k', type: 'withdrawal' as const, amount: 89, seconds: 10 },
  { user: 'jp***8m', type: 'deposit' as const, amount: 120, seconds: 47 },
  { user: 'kr***2x', type: 'deposit' as const, amount: 350, seconds: 84 },
  { user: 'de***7n', type: 'withdrawal' as const, amount: 560, seconds: 121 },
  { user: 'fr***1p', type: 'deposit' as const, amount: 1200, seconds: 158 },
  { user: 'sg***9q', type: 'deposit' as const, amount: 2800, seconds: 195 },
]

const PREFIXES = ['us', 'jp', 'kr', 'de', 'fr', 'sg', 'cn', 'uk', 'br', 'au', 'in', 'mx', 'ca', 'ru', 'th']
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const WITHDRAW_AMOUNTS = [89, 120, 156, 230, 340, 560, 780, 890, 1200, 1850]
const DEPOSIT_AMOUNTS = [120, 200, 350, 480, 600, 890, 1200, 1800, 2400, 2800, 3500, 5000]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomUser(): string {
  const prefix = pick(PREFIXES)
  const a = CHARS[Math.floor(Math.random() * CHARS.length)]
  const b = CHARS[Math.floor(Math.random() * CHARS.length)]
  return `${prefix}***${a}${b}`
}

export function generateActivity(createdAt = Date.now()): LiveActivity {
  const type: 'withdrawal' | 'deposit' = Math.random() > 0.42 ? 'deposit' : 'withdrawal'
  const base = type === 'withdrawal' ? pick(WITHDRAW_AMOUNTS) : pick(DEPOSIT_AMOUNTS)
  const amount = base + Math.floor(Math.random() * 40)
  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    user: randomUser(),
    type,
    amount,
    createdAt,
  }
}

export function createInitialActivities(count = 12): LiveActivity[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) =>
    generateActivity(now - i * 8000 - Math.floor(Math.random() * 3000)),
  )
}
