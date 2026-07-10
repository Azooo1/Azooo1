import { ASSET_BASE } from '../data/site'

export interface MinerTierStyle {
  gradient: string
  glow: string
  image: string
  tempBase: number
  tempRange: number
  powerBase: number
}

const TIERS: Record<number, MinerTierStyle> = {
  300: {
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
    image: `${ASSET_BASE}/images/miners/h21e.png`,
    tempBase: 58,
    tempRange: 12,
    powerBase: 1800,
  },
  5000: {
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20',
    image: `${ASSET_BASE}/images/miners/e21e.png`,
    tempBase: 62,
    tempRange: 14,
    powerBase: 2400,
  },
  30000: {
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    image: `${ASSET_BASE}/images/miners/c15-pro.png`,
    tempBase: 68,
    tempRange: 10,
    powerBase: 3200,
  },
}

export function getMinerTier(price: number, color?: string): MinerTierStyle & { gradient: string } {
  let tier: MinerTierStyle
  if (price >= 30000) tier = TIERS[30000]
  else if (price >= 5000) tier = TIERS[5000]
  else tier = TIERS[300]
  if (color?.startsWith('from-')) return { ...tier, gradient: color }
  return tier
}

export function getMinerImageById(_id: string, price?: number): string {
  if (price !== undefined) {
    return getMinerTier(price).image
  }
  return `${ASSET_BASE}/images/miners/h21e.png`
}

export function baseHashRate(dailyOutput: string | number) {
  return 1000 * (parseFloat(String(dailyOutput)) || 13)
}

export function glowColor(gradient: string) {
  if (gradient.includes('blue') || gradient.includes('cyan')) return 'rgba(59,130,246,0.3)'
  if (gradient.includes('purple') || gradient.includes('pink') || gradient.includes('teal')) {
    return 'rgba(168,85,247,0.3)'
  }
  return 'rgba(245,158,11,0.3)'
}

export const STATUS_DARK: Record<string, { color: string; bg: string; dot: string }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  RUNNING: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  STOPPED: { color: 'text-gray-400', bg: 'bg-gray-500/10', dot: 'bg-gray-400' },
  REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  APPROVED: { color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  EXPIRED: { color: 'text-gray-500', bg: 'bg-gray-500/10', dot: 'bg-gray-500' },
}
