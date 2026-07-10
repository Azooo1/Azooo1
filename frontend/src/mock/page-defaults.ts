import type { ExchangeConfig, WithdrawConfig } from '../api/client'

export const DEFAULT_EXCHANGE_CONFIG: ExchangeConfig = {
  enabled: true,
  macToUsdtRate: 0.27,
  macToUsdcRate: 0.27,
  feeRate: 0,
  minAmount: 10,
  maxAmount: 10000,
  dailyLimit: 50000,
}

export const DEFAULT_WITHDRAW_CONFIG: WithdrawConfig = {
  feeRate: 0,
  minFee: 2,
  maxFee: 2,
  minAmount: 3,
  maxAmount: 50000,
  processingTime: 24,
}

export const DEFAULT_C2C_BALANCE = 4030
