import type { UserMiner } from '../api/types'
import { baseHashRate, getMinerTier } from '../utils/minerTheme'

export interface LiveMetrics {
  hashrate: number
  temperature: number
  fanSpeed: number
  power: number
}

export function initialMetrics(miner: UserMiner): LiveMetrics {
  const tier = getMinerTier(parseFloat(miner.minerType.price))
  const hr = baseHashRate(miner.minerType.dailyOutput)
  return {
    hashrate: hr,
    temperature: tier.tempBase + tier.tempRange / 2,
    fanSpeed: 75,
    power: tier.powerBase,
  }
}

export function jitterMetrics(miner: UserMiner): LiveMetrics {
  const tier = getMinerTier(parseFloat(miner.minerType.price))
  const base = baseHashRate(miner.minerType.dailyOutput)
  return {
    hashrate: base * (0.98 + Math.random() * 0.04),
    temperature: tier.tempBase + Math.random() * tier.tempRange,
    fanSpeed: 70 + Math.random() * 15,
    power: tier.powerBase * (0.95 + Math.random() * 0.1),
  }
}
