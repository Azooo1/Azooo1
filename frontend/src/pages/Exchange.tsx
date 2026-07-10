import { useCallback, useEffect, useMemo, useState } from 'react'
import { executeExchange, fetchExchangeInfo, type ExchangeConfig } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { HecLogo, UsdcLogo } from '../components/dashboard/CoinLogos'
import { useI18n } from '../i18n/I18nProvider'

import { DEFAULT_EXCHANGE_CONFIG } from '../mock/page-defaults'

const cardClass = 'rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5'

const inputPayClass =
  'w-full px-4 py-3 pr-20 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors'

const inputReceiveClass =
  'w-full px-4 py-3 pr-24 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white'

function TokenBadge({ symbol }: { symbol: 'HEC' | 'USDC' }) {
  if (symbol === 'HEC') {
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <HecLogo size={24} />
        <span className="font-medium text-white">HEC</span>
      </div>
    )
  }
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
      <UsdcLogo size={24} />
      <span className="font-medium text-white">USDC</span>
    </div>
  )
}

export default function Exchange() {
  const { user, token, updateUser } = useAuth()
  const { messages, t } = useI18n()
  const [amount, setAmount] = useState('')
  const [config, setConfig] = useState<ExchangeConfig>(DEFAULT_EXCHANGE_CONFIG)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const hecBal = parseFloat(user?.macBalance || '0')
  const usdtBal = parseFloat(user?.usdtBalance || user?.usdcBalance || '0')
  const rate = config.macToUsdtRate ?? config.macToUsdcRate

  const loadConfig = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchExchangeInfo(token)
      if (res.config) setConfig(res.config)
    } catch {
      // keep defaults
    }
  }, [token])

  useEffect(() => {
    loadConfig()
    const timer = setInterval(loadConfig, 30_000)
    return () => clearInterval(timer)
  }, [loadConfig])

  const parsedAmount = parseFloat(amount) || 0
  const receiveAmount = useMemo(() => {
    if (!parsedAmount) return 0
    return parsedAmount * rate * (1 - (config.feeRate || 0))
  }, [parsedAmount, rate, config.feeRate])

  const canSubmit =
    config.enabled &&
    parsedAmount >= config.minAmount &&
    parsedAmount <= hecBal &&
    parsedAmount <= config.maxAmount &&
    !submitting

  const handleMax = () => {
    setAmount(hecBal.toFixed(2))
    setError('')
    setSuccess('')
  }

  const handleConfirm = async () => {
    if (!token || !user) return
    setError('')
    setSuccess('')

    if (parsedAmount < config.minAmount) {
      setError(t('exchange.minAmountError', { min: config.minAmount }))
      return
    }
    if (parsedAmount > hecBal) {
      setError(t('exchange.insufficientBalance'))
      return
    }

    setSubmitting(true)
    try {
      const res = await executeExchange(token, parsedAmount, 'USDC')
      const toAmount = parseFloat(res.exchange.toAmount)
      updateUser({
        ...user,
        macBalance: (hecBal - parsedAmount).toFixed(2),
        usdtBalance: (usdtBal + toAmount).toFixed(2),
        usdcBalance: (usdtBal + toAmount).toFixed(2),
      })
      setAmount('')
      setSuccess(res.message || t('exchange.swapSuccess'))
      loadConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('exchange.title')}</h1>
        <p className="text-gray-400 mt-1">{t('exchange.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h2 className="font-bold text-white mb-4">{t('exchange.initiateSwap')}</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">{t('exchange.pay')}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                  setSuccess('')
                }}
                placeholder={t('exchange.amountPlaceholder')}
                className={inputPayClass}
              />
              <TokenBadge symbol="HEC" />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-500">{t('exchange.available', { balance: hecBal.toFixed(2) })}</span>
              <button
                type="button"
                onClick={handleMax}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {t('exchange.all')}
              </button>
            </div>
          </div>

          <div className="flex justify-center my-4">
            <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center border border-white/[0.1]">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">{t('exchange.receive')}</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={receiveAmount > 0 ? receiveAmount.toFixed(2) : '0.00'}
                className={inputReceiveClass}
              />
              <TokenBadge symbol="USDC" />
            </div>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/[0.06]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('exchange.currentRate')}</span>
              <span className="font-medium text-white">{t('exchange.rateValue', { rate: rate.toFixed(2) })}</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {success && <p className="text-emerald-400 text-sm mb-4">{success}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '...' : t('exchange.confirm')}
          </button>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="font-bold text-white mb-4">{t('exchange.myBalance')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <HecLogo size={32} />
                  <span className="font-medium text-white">HEC</span>
                </div>
                <span className="font-bold text-white tabular-nums">{hecBal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <UsdcLogo size={32} />
                  <span className="font-medium text-white">USDC</span>
                </div>
                <span className="font-bold text-white tabular-nums">${usdtBal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-amber-400/90 mb-3">{t('exchange.tipsTitle')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {messages.exchange.tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
