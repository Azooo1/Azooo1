import type { MinerTypeItem } from '../api/client'

export function formatMinerDailyOutput(dailyOutput: string) {
  const n = parseFloat(dailyOutput) || 0
  const text = n >= 1000 ? n.toLocaleString() : String(n)
  return `${text} HEC`
}

export function formatUsd(amount: number) {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calcMinerEarnings(dailyOutput: string, hecPrice: number) {
  const daily = parseFloat(dailyOutput) || 0
  const dailyEarnings = daily * hecPrice
  const monthlyEarnings = dailyEarnings * 30
  return { dailyEarnings, monthlyEarnings }
}

export function sortMinerTypes(list: MinerTypeItem[]) {
  return [...list].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
}

export function buildMinerStats(
  miner: MinerTypeItem,
  hecPrice: number,
  labels: { dailyOutput: string; dailyEarnings: string; monthlyEarnings: string; validity: string },
  validityText: string,
) {
  const { dailyEarnings, monthlyEarnings } = calcMinerEarnings(miner.dailyOutput, hecPrice)
  return [
    { label: labels.dailyOutput, value: formatMinerDailyOutput(miner.dailyOutput) },
    { label: labels.dailyEarnings, value: formatUsd(dailyEarnings) },
    { label: labels.monthlyEarnings, value: formatUsd(monthlyEarnings) },
    { label: labels.validity, value: validityText },
  ]
}
