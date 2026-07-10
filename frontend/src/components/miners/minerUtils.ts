import { getMinerTier } from '../../utils/minerTheme'

export function toNumber(v: number | string | undefined) {
  return Number(v) || 0
}

export function formatRuntime(startedAt: string | null) {
  if (!startedAt) return '--'
  const ms = Date.now() - new Date(startedAt).getTime()
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

export function daysUntil(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
}

export type ExpiryLevel = 'expired' | 'danger' | 'warning' | 'safe'

export function expiryLevel(expiresAt: string): ExpiryLevel {
  const d = daysUntil(expiresAt)
  if (d <= 0) return 'expired'
  if (d <= 3) return 'danger'
  if (d <= 7) return 'warning'
  return 'safe'
}

export function formatExpiry(
  expiresAt: string | null,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (!expiresAt) return '--'
  const d = daysUntil(expiresAt)
  if (d <= 0) return t('miners.expiry.expired')
  if (d === 1) return t('miners.expiry.oneDay')
  return t('miners.expiry.days', { days: d })
}

export function statusLabel(status: string, t: (key: string) => string) {
  const key = status.toLowerCase()
  const text = t(`miners.status.${key}`)
  return text === `miners.status.${key}` ? status : text
}

export function minerDisplayName(m: { name: string }) {
  return m.name
}

export { getMinerTier }
