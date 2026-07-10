import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './auth/AuthProvider'
import { I18nProvider } from './i18n/I18nProvider'
import WalletProvider from './wallet/WalletProvider'
import WalletServerBind from './wallet/WalletServerBind'
import { disableBrowserZoom } from './utils/disableZoom'

disableBrowserZoom()

// 清理历史版本注入的 WalletConnect 全屏遮罩（w3m-modal）
document.querySelectorAll('w3m-modal').forEach((el) => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <WalletProvider>
          <AuthProvider>
            <WalletServerBind />
            <App />
          </AuthProvider>
        </WalletProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)
