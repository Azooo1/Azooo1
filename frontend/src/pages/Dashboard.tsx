import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { fetchMyMiners, fetchPriceHistory } from '../api/client'
import { ASSET_BASE } from '../data/site'
import { useAuth } from '../auth/AuthProvider'
import { HecLogo, UsdcLogo } from '../components/dashboard/CoinLogos'
import InviteCard from '../components/dashboard/InviteCard'
import PriceChart from '../components/dashboard/PriceChart'
import MarketTicker from '../components/dashboard/MarketTicker'
import EvmWalletBalanceBar from '../components/dashboard/EvmWalletBalanceBar'
import WalletBalanceBar from '../components/dashboard/WalletBalanceBar'
import { useOnChainBalances } from '../hooks/useOnChainBalances'
import { useI18n } from '../i18n/I18nProvider'
import { isEvmAddress, isTronAddress } from '../wallet/address'
import { resolveConnectedOwner } from '../wallet/connectedWalletStore'

const INVITE_MIN_USDT = 300

export default function Dashboard() {
  const { user, token } = useAuth()
  const { messages, t } = useI18n()
  const { address: wagmiAddress } = useAccount()
  const d = messages.dashboard
  const [runningCount, setRunningCount] = useState(0)
  const [hecPrice, setHecPrice] = useState(0.27)
  const [inviteOpen, setInviteOpen] = useState(false)

  const walletAddress = resolveConnectedOwner(user?.evmAddress ?? null, wagmiAddress)
  const isEvm = Boolean(walletAddress && isEvmAddress(walletAddress))
  const { balances: chainBalances } = useOnChainBalances(isEvm ? walletAddress : null)

  useEffect(() => {
    if (!token) return
    fetchMyMiners(token)
      .then((res) => setRunningCount(res.miners.filter((m) => m.status === 'RUNNING').length))
      .catch(() => setRunningCount(0))
  }, [token])

  useEffect(() => {
    fetchPriceHistory(90)
      .then((res) => {
        if (res.success && typeof res.currentPrice === 'number') setHecPrice(res.currentPrice)
      })
      .catch(() => {})
  }, [])

  if (!user) return null

  const platformUsdtBal = parseFloat(user.usdtBalance || user.usdcBalance || '0')
  const hecBal = parseFloat(user.macBalance || '0')
  const onChainUsdc = isEvm ? chainBalances.usdc : platformUsdtBal
  const onChainEth = isEvm ? chainBalances.native : 0
  const usdtBal = onChainUsdc
  const totalAssets = hecBal * hecPrice + usdtBal
  const inviteQualified = usdtBal >= INVITE_MIN_USDT
  const inviteCode = user.inviteCode || user.id.slice(-6).toUpperCase()

  const cardClass = 'rounded-2xl bg-white/[0.07] border border-white/[0.12] p-5 group hover:bg-white/[0.05] transition-colors'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600/12 via-teal-600/12 to-cyan-600/12 border border-emerald-500/12 text-white relative overflow-hidden p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400/70 text-sm">{d.systemStatus}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            {t('dashboard.welcome', { username: user.username })}
          </h1>
          <p className="text-gray-400">{d.welcomeSubtitle}</p>
        </div>
      </div>

      {/* Wallet bar */}
      {isEvm && walletAddress ? (
        <EvmWalletBalanceBar
          address={walletAddress}
          walletLabel={d.wallet.label}
          loadingLabel={d.layout.loading}
          ethLabel={d.balance.eth}
          usdcLabel="USDC"
        />
      ) : isTronAddress(walletAddress ?? '') ? (
        <WalletBalanceBar
          address={walletAddress!}
          walletLabel={d.wallet.label}
          loadingLabel={d.layout.loading}
          fallbackUsdt={platformUsdtBal}
        />
      ) : (
        <div className="rounded-xl bg-white/[0.07] border border-white/[0.12] px-5 py-3 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {d.wallet.connectWallet}
          </div>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">{d.balance.mac}</p>
              <p className="text-3xl font-bold text-white tabular-nums">{hecBal.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">≈ ${(hecBal * hecPrice).toFixed(2)}</p>
            </div>
            <HecLogo className="group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {isEvm && (
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{d.balance.eth}</p>
                <p className="text-3xl font-bold text-white tabular-nums">{onChainEth.toFixed(4)}</p>
                <p className="text-sm text-gray-500 mt-1">Ethereum</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-300 text-xl font-bold group-hover:scale-110 transition-transform">
                Ξ
              </div>
            </div>
          </div>
        )}

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">{d.balance.usdc}</p>
              <p className="text-3xl font-bold text-white tabular-nums">{usdtBal.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{isEvm ? 'USDC (Ethereum)' : '(Tether)'}</p>
            </div>
            <UsdcLogo className="group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-5 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">{d.balance.total}</p>
              <p className="text-3xl font-bold text-white tabular-nums">${totalAssets.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">&nbsp;</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link to="/miner-center" className={`${cardClass} text-center relative`}>
          {runningCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              {runningCount}
            </span>
          )}
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-110 transition-transform shadow-lg">
            <img
              src={`${ASSET_BASE}/images/miners/m20.png`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = `${ASSET_BASE}/images/miners/c15-pro.png`
              }}
            />
          </div>
          <p className="font-semibold text-white">{d.quickActions.minerCenter}</p>
          <p className="text-sm text-gray-500 mt-1">
            {runningCount > 0
              ? t('dashboard.quickActions.minersRunning', { count: runningCount })
              : d.quickActions.applyCloudPower}
          </p>
        </Link>

        <Link to="/exchange" className={`${cardClass} text-center`}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <p className="font-semibold text-white">{d.quickActions.exchange}</p>
          <p className="text-sm text-gray-500 mt-1">{d.quickActions.quickExchange}</p>
        </Link>

        <Link to="/c2c" className={`${cardClass} text-center`}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="font-semibold text-white">{d.quickActions.c2c}</p>
          <p className="text-sm text-gray-500 mt-1">{d.quickActions.p2pTrade}</p>
        </Link>

        <Link to="/withdraw" className={`${cardClass} text-center`}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <p className="font-semibold text-white">{d.quickActions.withdraw}</p>
          <p className="text-sm text-gray-500 mt-1">{d.quickActions.withdrawAssets}</p>
        </Link>

        <button type="button" onClick={() => setInviteOpen(true)} className={`${cardClass} text-center cursor-pointer`}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <p className="font-semibold text-white">{d.quickActions.myInviteCode}</p>
          <p className="text-sm text-gray-500 mt-1">{d.quickActions.checkInviteCode}</p>
        </button>
      </div>

      {/* Price chart */}
      <div className="rounded-2xl bg-white/[0.07] border border-white/[0.12] p-6">
        <PriceChart
          livePriceLabel={d.chart.livePrice}
          range7d={d.chart.range7d}
          range30d={d.chart.range30d}
          range90d={d.chart.range90d}
          loadingLabel={d.macPrice.loading}
          highLabel={d.chart.high}
          lowLabel={d.chart.low}
          changeLabel={d.chart.change}
        />
      </div>

      {/* Crypto market */}
      <div className="rounded-2xl bg-white/[0.07] border border-white/[0.12] p-5">
        <h2 className="text-lg font-bold text-white mb-4">{d.cryptoMarket}</h2>
        <MarketTicker />
      </div>

      {inviteOpen && (
        <InviteCard
          title={d.invite.title}
          description={d.invite.description}
          myCode={d.invite.myCode}
          copyCode={d.invite.copyCode}
          copied={d.invite.copied}
          notQualified={d.invite.notQualified}
          contactSupport={d.invite.contactSupport}
          checkInviteCode={d.quickActions.checkInviteCode}
          inviteQualified={d.quickActions.inviteQualified}
          qualified={inviteQualified}
          inviteCode={inviteCode}
          defaultOpen
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  )
}
