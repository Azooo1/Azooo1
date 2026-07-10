import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import WalletConnectQrModal from '../../wallet/WalletConnectQrModal'
import QrCodeIcon from '../wallet/QrCodeIcon'
import { useHasBrowserWallet } from '../../hooks/useHasBrowserWallet'
import { useEvmWalletConnectScan } from '../../hooks/useEvmWalletConnectScan'
import { useEvmWalletConnect } from '../../wallet/useEvmWalletConnect'

const walletBtnClass =
  'w-full h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-300 hover:border-emerald-500/50 hover:text-white font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50'

interface Props {
  browserWalletLabel: string
  desktopHint: string
}

export default function LoginWalletSection({ browserWalletLabel, desktopHint }: Props) {
  const { t } = useI18n()
  const hasBrowserWallet = useHasBrowserWallet()
  const wallet = useEvmWalletConnect()
  const scan = useEvmWalletConnectScan()
  const a = (key: string) => t(`auth.login.${key}`)
  const showScanConnect = hasBrowserWallet === false
  const walletConnecting = wallet.connecting || scan.connecting

  const walletError =
    wallet.errorCode === 'no-evm-wallet' ? a('noEvmWallet') : wallet.error
  const scanError =
    scan.error === 'missing-project-id'
      ? a('missingProjectId')
      : scan.error === 'user-rejected'
        ? a('userRejectedConnect')
        : scan.error === 'wallet-pending'
          ? a('walletPending')
          : scan.error === 'connect-failed'
            ? a('connectFailed')
            : scan.error
              ? scan.error
              : null

  const connectError = showScanConnect ? scanError : walletError
  const [toastOpen, setToastOpen] = useState(false)
  const resolvedError = useMemo(() => {
    if (!connectError) return null
    if (connectError === 'no-evm-wallet') return a('noEvmWallet')
    if (connectError === 'user-rejected') return a('userRejectedConnect')
    if (connectError === 'wallet-pending') return a('walletPending')
    if (connectError === 'connect-failed') return a('connectFailed')
    return connectError
  }, [connectError, a])

  useEffect(() => {
    setToastOpen(Boolean(resolvedError))
  }, [resolvedError])

  const handleConnect = () => {
    if (showScanConnect) {
      void scan.connectScan()
      return
    }
    void wallet.connectInjected()
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        className={walletBtnClass}
        disabled={walletConnecting}
        onClick={handleConnect}
      >
        {showScanConnect && <QrCodeIcon />}
        {walletConnecting
          ? a('connecting')
          : showScanConnect
            ? a('scanQrWallet')
            : browserWalletLabel || t('nav.connectWallet')}
      </button>
      <p className="text-xs text-center text-gray-500">{desktopHint}</p>

      {toastOpen && resolvedError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm shadow-xl flex items-start gap-3">
          <span className="flex-1 leading-relaxed">{resolvedError}</span>
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            className="text-red-400/80 hover:text-red-200 shrink-0 leading-none"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      )}

      <WalletConnectQrModal
        open={scan.open}
        onClose={scan.close}
        uri={scan.uri}
        error={resolvedError}
        onRetry={() => void scan.retry()}
        title={a('scanQrWallet')}
        scanQrTip={a('scanQrTip')}
        desktopHint={desktopHint}
        connectFailedLabel={a('connectFailed')}
      />
    </div>
  )
}
