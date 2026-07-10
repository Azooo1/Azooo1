import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { isEvmAddress } from '../wallet/address'
import { resolveConnectedOwner } from '../wallet/connectedWalletStore'
import {
  applyMiner,
  batchMinerAction,
  fetchMinerTypes,
  fetchMyMiners,
  fetchPendingRewards,
  fetchPriceConfig,
  minerAction,
  type MinerTypeItem,
} from '../api/client'
import type { UserMiner } from '../api/types'
import { useAuth } from '../auth/AuthProvider'
import { useEvmPermit } from '../wallet/EvmPermitContext'
import MinerConfirmModal from '../components/miners/MinerConfirmModal'
import MinerListCard from '../components/miners/MinerListCard'
import MinerPreviewPanel from '../components/miners/MinerPreviewPanel'
import MinerShopModal from '../components/miners/MinerShopModal'
import MinerTerminalPanel from '../components/miners/MinerTerminalPanel'
import { initialMetrics, jitterMetrics, type LiveMetrics } from '../mock/miner-metrics'
import { sortMinerTypes } from '../utils/minerDisplay'
import { useI18n } from '../i18n/I18nProvider'
import { useOnChainBalances } from '../hooks/useOnChainBalances'

const COIN = 'HEC'

export default function Miners() {
  const { user, token } = useAuth()
  const { locale, t } = useI18n()
  const { address: wagmiAddress } = useAccount()

  const walletAddress = (() => {
    const addr = resolveConnectedOwner(user?.evmAddress ?? null, wagmiAddress)
    return addr && isEvmAddress(addr) ? addr : null
  })()
  const { balances: chainBalances } = useOnChainBalances(walletAddress)
  const [confirmType, setConfirmType] = useState<MinerTypeItem | null>(null)
  const permit = useEvmPermit()

  useEffect(() => {
    permit.setMinerTypeId(confirmType?.id ?? null)
  }, [confirmType?.id, permit.setMinerTypeId])

  const [miners, setMiners] = useState<UserMiner[]>([])
  const [minerTypes, setMinerTypes] = useState<MinerTypeItem[]>([])
  const [pendingReward, setPendingReward] = useState(0)
  const [hecPrice, setHecPrice] = useState(0.27)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [metrics, setMetrics] = useState<LiveMetrics>({ hashrate: 0, temperature: 0, fanSpeed: 0, power: 0 })

  const showBanner = useCallback((type: 'ok' | 'err', text: string) => {
    setBanner({ type, text })
  }, [])

  const patchMinerStatus = useCallback((id: string, status: UserMiner['status']) => {
    setMiners((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }, [])

  const loadMiners = useCallback(async () => {
    if (!token) return
    const res = await fetchMyMiners(token)
    const list = res.miners ?? []
    setMiners(list)
    setSelectedId((prev) => {
      if (prev && list.some((m) => m.id === prev)) return prev
      return list.find((m) => m.status === 'RUNNING')?.id ?? list[0]?.id ?? null
    })
  }, [token])

  const loadPending = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchPendingRewards(token)
      setPendingReward(res.totalPendingReward ?? 0)
    } catch {
      // ignore
    }
  }, [token])

  const loadAll = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const priceRes = await fetchPriceConfig()
      setHecPrice(priceRes.data?.currentPrice ?? 0.27)
      await Promise.all([loadMiners(), loadPending()])
    } catch {
      // keep stale
    } finally {
      setLoading(false)
    }
  }, [token, loadMiners, loadPending])

  useEffect(() => {
    fetchMinerTypes()
      .then((res) => setMinerTypes(sortMinerTypes(res.minerTypes?.filter((m) => m.status !== false) ?? [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    loadAll()
    const timer = setInterval(loadAll, 30_000)
    return () => clearInterval(timer)
  }, [loadAll])

  useEffect(() => {
    if (!token) return
    const timer = setInterval(loadPending, 3000)
    return () => clearInterval(timer)
  }, [token, loadPending])

  const selected = useMemo(() => miners.find((m) => m.id === selectedId) ?? null, [miners, selectedId])

  useEffect(() => {
    if (!selected) return
    setMetrics(initialMetrics(selected))
    if (selected.status !== 'RUNNING') return
    const tick = () => setMetrics(jitterMetrics(selected))
    tick()
    const timer = setInterval(tick, 800 + Math.random() * 400)
    return () => clearInterval(timer)
  }, [selected])

  const stats = useMemo(() => {
    const running = miners.filter((m) => m.status === 'RUNNING').length
    const dailyOutput = miners
      .filter((m) => m.status === 'RUNNING')
      .reduce((s, m) => s + Number(m.minerType.dailyOutput), 0)
    const totalMined = user ? Number(user.macBalance) : miners.reduce((s, m) => s + Number(m.totalMined), 0)
    return { total: miners.length, running, dailyOutput, totalMined }
  }, [miners, user])

  const hasStartable = miners.some((m) => m.status === 'STOPPED' || m.status === 'APPROVED')
  const hasRunning = miners.some((m) => m.status === 'RUNNING')

  const applyUsdcRequirement = useMemo(() => {
    if (!confirmType) return { total: 0, count: 0 }
    const now = Date.now()
    const occupied = miners.filter((m) => {
      if (m.grantSource === 'admin_grant') return false
      if (!['RUNNING', 'APPROVED', 'STOPPED'].includes(m.status)) return false
      if (m.expiresAt && new Date(m.expiresAt).getTime() <= now) return false
      return true
    })
    const total = occupied.reduce((s, m) => s + Number(m.minerType.price), 0) + Number(confirmType.price)
    return { total, count: occupied.length + 1 }
  }, [miners, confirmType])

  const handleAction = async (minerId: string, action: 'start' | 'stop') => {
    if (!token) return
    setActionId(minerId)
    patchMinerStatus(minerId, action === 'start' ? 'RUNNING' : 'STOPPED')
    try {
      await minerAction(token, minerId, action, walletAddress ?? undefined)
      await loadAll()
    } catch (e) {
      patchMinerStatus(minerId, action === 'start' ? 'STOPPED' : 'RUNNING')
      const msg = e instanceof Error ? e.message : t('miners.messages.actionFailed')
      showBanner('err', msg)
    } finally {
      setActionId(null)
    }
  }

  const handleBatch = async (action: 'start-all' | 'stop-all') => {
    if (!token) return
    if (action === 'stop-all' && !window.confirm(t('miners.list.batchStopConfirm'))) return
    setBatchLoading(true)
    const targets =
      action === 'start-all'
        ? miners.filter((m) => m.status === 'STOPPED' || m.status === 'APPROVED')
        : miners.filter((m) => m.status === 'RUNNING')
    targets.forEach((m) => patchMinerStatus(m.id, action === 'start-all' ? 'RUNNING' : 'STOPPED'))
    try {
      const res = await batchMinerAction(token, action, walletAddress ?? undefined)
      const success = Number(res.success) || 0
      const failed = Number(res.failed) || 0
      let text =
        success === 0 && failed === 0
          ? action === 'start-all'
            ? t('miners.messages.batchNoStartable')
            : t('miners.messages.batchNoRunning')
          : failed > 0
            ? t('miners.messages.batchActionPartial', { success, failed })
            : t('miners.messages.batchActionSuccess', { count: success })
      showBanner(failed > 0 ? 'err' : 'ok', text)
      await loadAll()
    } catch (e) {
      targets.forEach((m) => patchMinerStatus(m.id, action === 'start-all' ? 'STOPPED' : 'RUNNING'))
      const msg = e instanceof Error ? e.message : t('miners.messages.batchStartFailed')
      showBanner('err', msg)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleApply = async () => {
    if (!token || !confirmType) return
    const wallet = walletAddress
    if (!wallet || !isEvmAddress(wallet)) {
      setApplyError(t('miners.messages.needEvmWallet'))
      return
    }
    setApplying(true)
    setApplyError('')
    try {
      const approved = await permit.promptIfUnapproved(wallet, confirmType.id, { force: true })
      if (!approved) {
        // 未授权时仅弹出授权窗，用户在弹窗内完成授权后再点击申请
        return
      }
      await applyMiner(token, confirmType.id, wallet)
      showBanner('ok', t('miners.messages.applySuccess'))
      setConfirmType(null)
      await loadAll()
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('miners.messages.applyFailed')
      setApplyError(msg)
      showBanner('err', msg)
    } finally {
      setApplying(false)
    }
  }

  if (loading && miners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('miners.title')}</h1>
        <p className="text-gray-400 mt-1">{t('miners.list.emptyHint')}</p>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            banner.type === 'ok'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="hover:opacity-70">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-sm text-gray-500">{t('miners.stats.totalMiners')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-sm text-gray-500">{t('miners.stats.running')}</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.running}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-sm text-gray-500">{t('miners.stats.dailyOutput')}</p>
          <p className="text-2xl font-bold text-cyan-400">
            {stats.dailyOutput.toFixed(2)} {COIN}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4">
          <p className="text-sm text-emerald-400">{t('miners.stats.pendingReward')}</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums transition-all duration-300">
            {pendingReward.toFixed(4)} <span className="text-sm font-normal">{COIN}</span>
          </p>
          <p className="text-xs text-emerald-400/60 mt-1">{t('miners.stats.pendingRewardHint')}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-sm text-gray-500">{t('miners.stats.totalRevenue')}</p>
          <p className="text-2xl font-bold text-amber-400">
            {stats.totalMined.toFixed(2)} {COIN}
          </p>
        </div>
      </div>

            <div className="hidden lg:grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MinerPreviewPanel miner={selected} metrics={metrics} t={t} />
        <MinerTerminalPanel
          isRunning={selected?.status === 'RUNNING'}
          minerName={selected?.minerType.name}
          minerStatus={selected?.status}
          t={t}
        />
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold text-white">
              {t('miners.list.title')} ({miners.length})
            </h3>
            <span className="text-sm text-gray-500">
              {t('miners.stats.totalRevenue')}:{' '}
              <span className="font-bold text-emerald-400">
                {stats.totalMined.toFixed(2)} {COIN}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasStartable && (
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => handleBatch('start-all')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {batchLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('miners.list.batchStarting')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('miners.list.batchStart')}
                  </>
                )}
              </button>
            )}
            {hasRunning && (
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => handleBatch('stop-all')}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/[0.1] text-gray-300 rounded-xl font-medium text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50"
              >
                {batchLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    {t('miners.list.batchStopping')}
                  </>
                ) : (
                  t('miners.list.batchStop')
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShopOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span className="text-lg leading-none">+</span>
              {t('miners.shop.title')}
            </button>
          </div>
        </div>

        {miners.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p className="text-gray-400 mb-2">{t('miners.list.empty')}</p>
            <p className="text-gray-500 text-sm">{t('miners.list.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {miners.map((m) => (
              <MinerListCard
                key={m.id}
                miner={m}
                isSelected={m.id === selectedId}
                isRunning={m.status === 'RUNNING'}
                loading={actionId === m.id}
                locale={locale}
                coinSymbol={COIN}
                onSelect={() => setSelectedId(m.id)}
                onAction={(action) => handleAction(m.id, action)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-amber-400 mb-4">{t('miners.instructions.title')}</h3>
        <ol className="space-y-3 text-amber-400/80">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
            <span>
              立即申请
              <span className="block text-sm text-amber-400/60 mt-1">
                连接钱包后申请矿机，请根据钱包余额选择相应的矿机进行申请。
                注意：当矿机开始正常运行时，钱包余额低于申请的矿机数量，矿机会将自动停止产出。
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
            <span>申请矿机后系统会自动审核</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
            <span>审核通过后请启动矿机</span>
          </li>
        </ol>
      </div>

      <MinerShopModal
        open={shopOpen}
        minerTypes={minerTypes}
        macPrice={hecPrice}
        locale={locale}
        onClose={() => setShopOpen(false)}
        onSelect={(mt) => {
          setConfirmType(mt)
          setShopOpen(false)
        }}
        t={t}
      />

      {confirmType && (
        <MinerConfirmModal
          minerType={confirmType}
          wallet={walletAddress}
          chainUsdcBalance={chainBalances.usdc}
          requiredUsdcTotal={applyUsdcRequirement.total}
          occupiedMinerCount={applyUsdcRequirement.count}
          loading={applying}
          error={applyError}
          locale={locale}
          onClose={() => {
            setConfirmType(null)
            setApplyError('')
          }}
          onConfirm={handleApply}
          t={t}
        />
      )}

    </div>
  )
}
