import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchWithdrawals,
  submitWithdraw,
  type WithdrawConfig,
  type WithdrawRecord,
} from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { UsdcLogo } from '../components/dashboard/CoinLogos'
import { useI18n } from '../i18n/I18nProvider'
import { isEvmAddress } from '../wallet/address'

import { DEFAULT_WITHDRAW_CONFIG } from '../mock/page-defaults'

const WITHDRAW_CHAIN = 'EVM'

const cardClass = 'rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5'

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function EvmNetworkLogo({ size = 20 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-indigo-300 font-bold" style={{ fontSize: size * 0.34 }}>
        Ξ
      </span>
    </div>
  )
}

function formatRecordTime(dateStr: string, locale: string) {
  const localeTag = locale === 'zh' ? 'zh-CN' : locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'
  return new Date(dateStr).toLocaleString(localeTag, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Withdraw() {
  const { user, token, updateUser, refreshUser } = useAuth()
  const { locale, messages, t } = useI18n()
  const [amount, setAmount] = useState('')
  const [config, setConfig] = useState<WithdrawConfig>(DEFAULT_WITHDRAW_CONFIG)
  const [records, setRecords] = useState<WithdrawRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const usdcBal = parseFloat(user?.usdcBalance || user?.usdtBalance || '0')
  const walletAddress = user?.evmAddress?.trim() || ''
  const hasEvmWallet = Boolean(walletAddress && isEvmAddress(walletAddress))

  const statusMap = useMemo(
    () => ({
      PENDING: { label: t('withdraw.statusPending'), className: 'bg-yellow-500/20 text-yellow-400' },
      APPROVED: { label: t('withdraw.statusApproved'), className: 'bg-blue-500/20 text-blue-400' },
      COMPLETED: { label: t('withdraw.statusCompleted'), className: 'bg-emerald-500/20 text-emerald-400' },
      REJECTED: { label: t('withdraw.statusRejected'), className: 'bg-red-500/20 text-red-400' },
    }),
    [t],
  )

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      setLoadingRecords(true)
      await refreshUser()
      const res = await fetchWithdrawals(token)
      setRecords(res.withdrawals || [])
      if (res.config) setConfig(res.config)
    } catch {
      // keep defaults
    } finally {
      setLoadingRecords(false)
    }
  }, [token, refreshUser])

  useEffect(() => {
    loadData()
  }, [loadData])

  const parsedAmount = parseFloat(amount) || 0
  const maxWithdraw = Math.max(0, usdcBal - (config.minFee || 0))

  const canSubmit =
    hasEvmWallet &&
    parsedAmount >= config.minAmount &&
    parsedAmount <= usdcBal &&
    parsedAmount <= config.maxAmount &&
    !submitting

  const handleMax = () => {
    setAmount(maxWithdraw.toFixed(2))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async () => {
    if (!token || !user || !hasEvmWallet) return
    setError('')
    setSuccess('')

    if (parsedAmount < config.minAmount) {
      setError(t('withdraw.minAmountError', { min: config.minAmount }))
      return
    }
    if (parsedAmount > usdcBal) {
      setError(t('withdraw.insufficientBalance'))
      return
    }

    setSubmitting(true)
    try {
      const res = await submitWithdraw(token, {
        amount: parsedAmount,
        currency: 'USDC',
        chain: WITHDRAW_CHAIN,
        toAddress: walletAddress,
      })
      updateUser({
        ...user,
        usdtBalance: (usdcBal - parsedAmount).toFixed(2),
        usdcBalance: (usdcBal - parsedAmount).toFixed(2),
      })
      setAmount('')
      setSuccess(res.message || t('withdraw.submitSuccess'))
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('withdraw.title')}</h1>
        <p className="text-gray-400 mt-1">{t('withdraw.subtitle')}</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckIcon />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h2 className="font-bold text-white mb-4">{t('withdraw.initiateWithdraw')}</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">{t('withdraw.currency')}</label>
            <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UsdcLogo size={40} />
                  <div>
                    <div className="font-semibold text-white">{t('withdraw.usdcLabel')}</div>
                    <div className="text-sm text-gray-500">{t('withdraw.usdcSub')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white tabular-nums">{usdcBal.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{t('withdraw.available')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">{t('withdraw.selectNetwork')}</label>
            <div className="p-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center gap-3">
              <EvmNetworkLogo size={28} />
              <span className="font-medium text-white">{t('withdraw.evmNetwork')}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">{t('withdraw.amount')}</label>
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
              placeholder={t('withdraw.amountPlaceholder')}
              className={inputClass}
            />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-500">{t('withdraw.availableBalance', { balance: `$${usdcBal.toFixed(2)}` })}</span>
              <button
                type="button"
                onClick={handleMax}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {t('withdraw.all')}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">{t('withdraw.address')}</label>
            {hasEvmWallet ? (
              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-mono text-sm break-all">{walletAddress}</span>
                  <CheckIcon />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('withdraw.addressFromWallet')}</p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="text-yellow-400 text-sm">{t('withdraw.pleaseConnectWallet')}</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('withdraw.submitting') : t('withdraw.confirm')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/20 p-5">
            <h3 className="font-bold text-yellow-400 mb-2">{t('withdraw.noticeTitle')}</h3>
            <ul className="space-y-2 text-sm text-yellow-400/80">
              <li>• {messages.withdraw.notes[0]}</li>
              <li>• {messages.withdraw.notes[1]}</li>
              <li>• {messages.withdraw.notes[2].replace('{min}', String(config.minAmount))}</li>
              <li>• {messages.withdraw.notes[3].replace('{fee}', String(config.minFee))}</li>
            </ul>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-white mb-4">{t('withdraw.historyTitle')}</h3>
            {loadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">{t('withdraw.noHistory')}</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => {
                  const status = statusMap[record.status]
                  const displayCurrency =
                    record.currency === 'USDT' || record.currency === 'USDC' ? 'USDC' : record.currency
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]"
                    >
                      <div>
                        <p className="font-medium text-white tabular-nums">
                          ${Number(record.amount).toFixed(2)} {displayCurrency}
                        </p>
                        <p className="text-sm text-gray-500">{formatRecordTime(record.createdAt, locale)}</p>
                        {record.status === 'REJECTED' && record.reviewNote && (
                          <p className="text-xs text-red-400 mt-1">{record.reviewNote}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
