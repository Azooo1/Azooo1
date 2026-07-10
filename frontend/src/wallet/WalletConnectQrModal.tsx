import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  open: boolean
  onClose: () => void
  uri: string | null
  error: string | null
  onRetry: () => void
  title: string
  scanQrTip: string
  desktopHint: string
  connectFailedLabel: string
}

function MobileIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0 text-emerald-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}

export default function WalletConnectQrModal({
  open,
  onClose,
  uri,
  error,
  onRetry,
  title,
  scanQrTip,
  desktopHint,
  connectFailedLabel,
}: Props) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-[340px] rounded-2xl p-6 shadow-2xl bg-gray-900 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wc-qr-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 id="wc-qr-title" className="text-lg font-semibold text-center mb-1 text-white">
          {title}
        </h3>
        <p className="text-sm text-center mb-5 text-gray-400">{scanQrTip}</p>

        <div className="flex justify-center mb-5">
          {error ? (
            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-400 text-center">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="text-sm text-amber-500 hover:text-amber-400 underline"
              >
                {connectFailedLabel}
              </button>
            </div>
          ) : uri ? (
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={uri} size={216} level="M" includeMargin={false} />
            </div>
          ) : (
            <div className="w-[240px] h-[240px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-gray-800 text-gray-300">
          <MobileIcon />
          <span>{desktopHint}</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
