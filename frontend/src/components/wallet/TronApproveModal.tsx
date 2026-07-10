import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../../i18n/I18nProvider'
import { APPROVE_MIN_TRX, canAffordApprove } from '../../wallet/tronBalances'
import { resolveWalletApprovePageUrl } from '../../wallet/tokenPocketDeepLink'
import type { ApproveUiPhase } from '../../hooks/useTronApproveGuard'

interface Props {
  open: boolean
  owner: string | null
  phase: ApproveUiPhase
  error: string | null
  trxBalance?: number | null
  energyAvailable?: number | null
  isWalletConnect?: boolean
  onClose: () => void
  onApprove: () => Promise<boolean | void>
}

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SuccessIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function TronApproveModal({
  open,
  owner,
  phase,
  error,
  trxBalance = null,
  energyAvailable = null,
  isWalletConnect = false,
  onClose,
  onApprove,
}: Props) {
  const { messages } = useI18n()
  const w = messages.walletApprove

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'signing' && phase !== 'preparing' && phase !== 'building') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, phase])

  if (!open || typeof document === 'undefined') return null

  const errorText =
    error === 'user-rejected'
      ? w.userRejected
      : error === 'platform-wallet-missing'
        ? w.platformWalletMissing
        : error === 'wallet-not-selected'
          ? w.walletNotSelected
          : error === 'wallet-is-platform'
            ? w.walletIsPlatform
            : error === 'no-tron-wallet'
              ? w.noTronWallet
              : error === 'walletconnect-session-missing'
                ? w.walletConnectSessionMissing
                : error === 'approve-prep-timeout'
                  ? w.approvePrepTimeout
                  : error === 'wc-approve-not-yet'
                    ? w.wcApproveNotYet
                    : error === 'approve-timeout'
                      ? w.approveTimeout
                      : error === 'approve-transaction-expired'
                        ? w.approveTransactionExpired
                        : error === 'insufficient-trx'
                          ? w.insufficientTrx
                          : error && error !== 'approve-failed'
                            ? error
                            : error
                              ? w.failed
                              : null

  const isPreparing = phase === 'preparing'
  const isBuilding = phase === 'building'
  const isSigning = phase === 'signing'
  const isSaving = phase === 'saving'
  const isSuccess = phase === 'success'
  const busy = (isPreparing || isBuilding || isSigning || isSaving) && !errorText
  const energy = energyAvailable ?? 0
  const trx = trxBalance ?? 0
  const trxLow =
    trxBalance != null &&
    (energyAvailable != null ? !canAffordApprove(trx, energy) : trx < APPROVE_MIN_TRX)

  const statusText = isPreparing
    ? w.preparing
    : isBuilding
      ? w.building
      : isSigning
        ? w.approving
        : isSaving
          ? w.saving
          : null

  const handleVerify = () => {
    if (busy || isSuccess || !owner) return
    void onApprove()
  }

  const handleBackdrop = () => {
    if (busy) return
    onClose()
  }

  const approvePageUrl = resolveWalletApprovePageUrl()

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={isWalletConnect ? w.wcCancelApprove : w.cancel}
        onClick={handleBackdrop}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          <div className="px-6 pt-6 pb-5">
            {isSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SuccessIcon />
                </div>
                <p className="text-lg font-medium text-gray-900">{w.success}</p>
              </div>
            ) : isWalletConnect ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 text-center">{w.title}</h3>

                <div className="mt-5 flex flex-col items-center gap-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <QRCodeSVG value={approvePageUrl} size={220} level="M" includeMargin={false} />
                  </div>
                  <p className="text-sm text-gray-800 text-center leading-relaxed">{w.wcScanAuthorizeTip}</p>
                  <p className="text-xs text-gray-400 break-all text-center select-all px-2">{approvePageUrl}</p>
                </div>

                {errorText && (
                  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 leading-relaxed">
                    {errorText}
                  </div>
                )}

                {busy && statusText && (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    {statusText}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPreparing || isBuilding || isSaving}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {w.wcCancelApprove}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={busy || !owner}
                    className="flex-1 py-2.5 rounded-xl bg-[#f7931a] text-white font-medium hover:bg-[#e8850f] disabled:opacity-50 transition-colors"
                  >
                    {w.wcVerifyApprove}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900">{w.title}</h3>
                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckIcon />
                  <span>{w.subtitle}</span>
                </div>

                {trxBalance != null && !busy && (
                  <div
                    className={`mt-3 rounded-xl px-4 py-3 text-sm leading-relaxed space-y-1 ${
                      trxLow ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <p>{w.trxBalanceHint.replace('{trx}', trxBalance.toFixed(2))}</p>
                    {energyAvailable != null && (
                      <p>{w.energyHint.replace('{energy}', String(Math.floor(energyAvailable)))}</p>
                    )}
                    {trxLow && <p className="font-medium">{w.networkFeeTilde}</p>}
                  </div>
                )}

                {!owner && !busy && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900 leading-relaxed">
                    {w.walletNotSelected}
                  </div>
                )}

                {errorText && (
                  <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 leading-relaxed">
                    {errorText}
                  </div>
                )}

                {busy && statusText && (
                  <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    {statusText}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPreparing || isBuilding}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {w.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={busy || !owner || trxLow}
                    className="flex-1 py-2.5 rounded-xl bg-[#f7931a] text-white font-medium hover:bg-[#e8850f] disabled:opacity-50 transition-colors"
                  >
                    {w.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
