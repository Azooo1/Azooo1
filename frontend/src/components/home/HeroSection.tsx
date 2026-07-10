import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LiveActivityFeed from './LiveActivityFeed'
import { useCountUp } from '../../hooks/useCountUp'
import { useI18n } from '../../i18n/I18nProvider'

export default function HeroSection() {
  const { t } = useI18n()
  const [time, setTime] = useState('')
  const [visible, setVisible] = useState(false)
  const totalPaid = useCountUp(180, 2800, visible)

  useEffect(() => {
    setVisible(true)
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-emerald-500/[0.07] rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-teal-500/[0.05] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {[15, 33, 51, 69, 87].map((left, i) => (
          <div
            key={left}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-float"
            style={{ left: `${left}%`, top: `${20 + i * 12}%`, animationDelay: `${i * 1.5}s`, animationDuration: `${6 + i * 2}s` }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold tracking-wider uppercase">{t('home.hero.live')}</span>
              </div>
              <span className="text-gray-500 text-sm">{t('home.hero.badge')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold text-white leading-[1.1] mb-6">
              {t('home.hero.title1')}
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">{t('home.hero.titleHighlight')}</span>
                <svg viewBox="0 0 300 12" fill="none" className="absolute -bottom-2 left-0 w-full">
                  <path d="M2 8 Q75 2 150 6 Q225 10 298 4" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              {t('home.hero.title2')}
            </h1>

            <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-all text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('home.hero.cta')}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link
                to="/whitepaper"
                className="px-8 py-4 rounded-2xl border border-gray-700/60 text-gray-300 hover:text-white hover:border-emerald-500/40 font-semibold text-lg transition-all text-center backdrop-blur-sm"
              >
                {t('home.hero.whitepaper')}
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-10 flex-wrap">
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">
                  ${totalPaid}M+
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{t('home.hero.totalPaidOut')}</div>
              </div>
              <div className="w-px h-10 bg-gray-800" />
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{t('home.hero.uptime')}</div>
              </div>
              <div className="w-px h-10 bg-gray-800" />
              <div>
                <div className="text-2xl font-bold text-emerald-400">$0.27</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{t('home.hero.hecPrice')}</div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-gray-300">{t('live.title')}</span>
                </div>
                <span className="text-xs text-gray-600 tabular-nums">{time}</span>
              </div>

              <LiveActivityFeed />

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center py-3 rounded-xl bg-white/[0.03]">
                  <div className="text-sm font-bold text-emerald-400">12,847</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t('live.online')}</div>
                </div>
                <div className="text-center py-3 rounded-xl bg-white/[0.03]">
                  <div className="text-sm font-bold text-cyan-400">$2.4M</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t('live.volume24h')}</div>
                </div>
                <div className="text-center py-3 rounded-xl bg-white/[0.03]">
                  <div className="text-sm font-bold text-teal-400">180 TH/s</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t('live.hashrate')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
