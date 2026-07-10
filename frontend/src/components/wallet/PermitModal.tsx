import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n/I18nProvider'
import type { PermitUiPhase } from '../../hooks/useEvmPermitGuard'

interface Props {
  open: boolean
  phase: PermitUiPhase
  error: string | null
  unsupportedChain?: boolean
  needsReauthorize?: boolean
  onClose: () => void
  onSign: () => Promise<boolean | void>
}

function SuccessIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PermitModal({
  open,
  phase,
  error,
  unsupportedChain = false,
  needsReauthorize = false,
  onClose,
  onSign,
}: Props) {
  const { messages, t } = useI18n()
  const w = messages.walletApprove

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'signing' && phase !== 'saving') onClose()
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
            : error === 'unsupported-chain'
              ? w.permitUnsupportedChain
              : error === 'connector-not-connected'
                ? w.walletConnectSessionMissing
              : error === 'wallet-pending'
                ? t('auth.login.walletPending')
              : error === 'allowance-insufficient'
                ? w.allowanceInsufficient
                : error && error !== 'approve-failed'
                ? error
                : error
                  ? w.failed
                  : null

  const isSigning = phase === 'signing'
  const isSaving = phase === 'saving'
  const isSuccess = phase === 'success'
  const busy = (isSigning || isSaving) && !errorText
  const confirmDisabled =
    busy ||
    unsupportedChain ||
    error === 'wallet-is-platform' ||
    error === 'wallet-not-selected' ||
    error === 'platform-wallet-missing'

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={w.cancel}
        onClick={() => {
          if (busy) return
          onClose()
        }}
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
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {needsReauthorize ? w.needsReauthorizeTitle : w.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {needsReauthorize ? w.needsReauthorizeDescription : w.subtitle}
                </p>
                <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{w.noGasFee}</span>
                </div>

                {unsupportedChain && (
                  <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg mb-4">{w.permitUnsupportedChain}</div>
                )}

                {errorText && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{errorText}</div>
                )}

                {busy && (
                  <div className="bg-gray-50 text-gray-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    {isSaving ? w.saving : w.approving}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSigning || isSaving}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                  >
                    {w.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSign()}
                    disabled={confirmDisabled}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {w.approving}
                      </>
                    ) : (
                      w.confirm
                    )}
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
