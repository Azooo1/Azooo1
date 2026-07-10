import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cancelC2cOrder,
  createC2cOrder,
  fetchC2cOrders,
  type C2cOrder,
} from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n/I18nProvider'

type OrderStatus = 'pending' | 'progress' | 'completed' | 'cancelled'

interface DisplayOrder {
  id: string
  amount: number
  price: number
  total: number
  status: OrderStatus
  time: string
  buyer: string
}

function fmtNum(v: number) {
  return Number.isFinite(v) ? v.toFixed(2) : '0.00'
}

function fmtInt(v: number) {
  return Number.isFinite(v) ? v.toLocaleString('en-US') : '0'
}

function fmtPrice(v: number) {
  return Number.isFinite(v) ? v.toFixed(4) : '0.0000'
}

function fmtMoney(v: number) {
  return Number.isFinite(v) ? v.toFixed(2) : '0.00'
}

function mapStatus(status: C2cOrder['status']): OrderStatus {
  switch (status) {
    case 'ACCEPTED':
      return 'progress'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

function formatOrderTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toDisplayOrder(row: C2cOrder): DisplayOrder {
  return {
    id: row.id,
    amount: parseFloat(row.amount) || 0,
    price: parseFloat(row.price) || 0,
    total: parseFloat(row.totalPrice) || 0,
    status: mapStatus(row.status),
    time: formatOrderTime(row.createdAt),
    buyer: row.buyerName || '',
  }
}

function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    progress: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {label}
    </span>
  )
}

export default function C2C() {
  const { user, token, refreshUser } = useAuth()
  const { t } = useI18n()
  const [showModal, setShowModal] = useState(false)
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [currentPrice, setCurrentPrice] = useState(0.27)
  const [minAmount, setMinAmount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ amount: '', price: '0.2700' })
  const [toast, setToast] = useState('')

  const available = parseFloat(user?.macBalance || '0') || 0

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      await refreshUser()
      const res = await fetchC2cOrders(token)
      setOrders(res.orders.map(toDisplayOrder))
      if (typeof res.currentPrice === 'number' && res.currentPrice > 0) {
        setCurrentPrice(res.currentPrice)
        setForm((f) => (f.amount ? f : { ...f, price: res.currentPrice.toFixed(4) }))
      }
      if (res.config?.minAmount) setMinAmount(res.config.minAmount)
    } catch (err) {
      setToast(err instanceof Error ? err.message : t('c2c.postSuccess'))
    } finally {
      setLoading(false)
    }
  }, [token, refreshUser, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(
    () => ({
      available,
      pending: orders.filter((o) => o.status === 'pending').length,
      inProgress: orders.filter((o) => o.status === 'progress').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders, available],
  )

  const estimatedTotal = (parseFloat(form.amount) || 0) * (parseFloat(form.price) || 0)

  const statusLabel = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending: t('c2c.pending'),
      progress: t('c2c.inProgress'),
      completed: t('c2c.completed'),
      cancelled: t('c2c.cancelled'),
    }
    return map[status]
  }

  const cancelOrder = async (id: string) => {
    if (!token) return
    try {
      await cancelC2cOrder(token, id)
      setToast(t('c2c.cancelled'))
      await loadData()
    } catch (err) {
      setToast(err instanceof Error ? err.message : t('c2c.insufficientBalance'))
    }
  }

  const submitPublish = async () => {
    if (!token) return
    const amount = parseFloat(form.amount)
    const price = parseFloat(form.price)
    if (!amount || amount <= 0) return
    if (!price || price <= 0) return
    if (amount < minAmount) {
      setToast(t('c2c.minAmountError', { min: String(minAmount) }))
      return
    }
    if (amount > available) {
      setToast(t('c2c.insufficientBalance'))
      return
    }
    setSubmitting(true)
    try {
      await createC2cOrder(token, amount, price)
      setForm({ amount: '', price: currentPrice.toFixed(4) })
      setShowModal(false)
      setToast(t('c2c.postSuccess'))
      await loadData()
    } catch (err) {
      setToast(err instanceof Error ? err.message : t('c2c.insufficientBalance'))
    } finally {
      setSubmitting(false)
    }
  }

  const statCards = [
    { label: t('c2c.availableHec'), value: fmtNum(stats.available), color: 'text-emerald-400' },
    { label: t('c2c.pending'), value: String(stats.pending), color: 'text-amber-400' },
    { label: t('c2c.inProgress'), value: String(stats.inProgress), color: 'text-blue-400' },
    { label: t('c2c.completed'), value: String(stats.completed), color: 'text-emerald-400' },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{t('c2c.title')}</h1>
          <p className="text-gray-400 text-sm">{t('c2c.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          {t('c2c.postOrder')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
            <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
            <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold">{t('c2c.myOrders')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-white/[0.06]">
                <th className="text-left font-medium px-5 py-3">{t('c2c.orderNo')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.amountHec')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.unitPriceUsdc')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.totalUsdc')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.statusCol')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.time')}</th>
                <th className="text-left font-medium px-3 py-3">{t('c2c.buyer')}</th>
                <th className="text-left font-medium px-5 py-3">{t('c2c.action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                    {t('dashboard.layout.loading')}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                    {t('c2c.noOrders')}
                  </td>
                </tr>
              ) : (
                orders.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-gray-300 font-mono text-xs">#{row.id}</td>
                    <td className="px-3 py-3.5 text-white tabular-nums">{fmtInt(row.amount)}</td>
                    <td className="px-3 py-3.5 text-gray-300 tabular-nums">${fmtPrice(row.price)}</td>
                    <td className="px-3 py-3.5 text-white tabular-nums">${fmtMoney(row.total)}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={row.status} label={statusLabel(row.status)} />
                    </td>
                    <td className="px-3 py-3.5 text-gray-400 text-xs whitespace-nowrap">{row.time}</td>
                    <td className="px-3 py-3.5 text-gray-300">{row.buyer || '—'}</td>
                    <td className="px-5 py-3.5">
                      {row.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => void cancelOrder(row.id)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
                        >
                          {t('c2c.cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-5 py-2.5 rounded-xl bg-[#1e2830] border border-emerald-500/30 text-emerald-400 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a2538] border border-white/[0.08] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">{t('c2c.modalTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('c2c.sellAmount')}</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={t('c2c.sellAmountPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('c2c.unitPrice')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder={t('c2c.unitPricePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white outline-none focus:border-emerald-500/50"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {t('c2c.suggestedPrice').replace('0.27', currentPrice.toFixed(2))}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('c2c.estimatedTotal')}</label>
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-emerald-400 font-semibold tabular-nums">
                  ${fmtMoney(estimatedTotal)}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-gray-400 hover:text-white transition-colors"
              >
                {t('c2c.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void submitPublish()}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60"
              >
                {submitting ? t('withdraw.submitting') : t('c2c.confirmPost')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
