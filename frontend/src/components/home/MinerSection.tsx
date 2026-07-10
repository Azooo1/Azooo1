import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMinerTypes, fetchPriceConfig } from '../../api/client'
import type { MinerTypeItem } from '../../api/client'
import { useI18n } from '../../i18n/I18nProvider'
import MinerImage from '../miners/MinerImage'
import { buildMinerStats, sortMinerTypes } from '../../utils/minerDisplay'

export default function MinerSection() {
  const { t } = useI18n()
  const [miners, setMiners] = useState<MinerTypeItem[]>([])
  const [hecPrice, setHecPrice] = useState(0.27)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchMinerTypes(), fetchPriceConfig()])
      .then(([typesRes, priceRes]) => {
        if (cancelled) return
        const list = sortMinerTypes(typesRes.minerTypes?.filter((m) => m.status !== false) ?? [])
        setMiners(list)
        setHecPrice(priceRes.data?.currentPrice ?? 0.27)
        setActive(0)
      })
      .catch(() => {
        if (!cancelled) setMiners([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeMiner = miners[active] ?? null

  const stats = useMemo(() => {
    if (!activeMiner) return []
    const validityText = t('miners.shop.validityDays', { days: activeMiner.validityDays })
    return buildMinerStats(
      activeMiner,
      hecPrice,
      {
        dailyOutput: t('home.minerSection.dailyOutput'),
        dailyEarnings: t('home.minerSection.dailyEarnings'),
        monthlyEarnings: t('home.minerSection.monthlyEarnings'),
        validity: t('home.minerSection.validity'),
      },
      validityText,
    ).map((stat, i) => {
      const colors = [
        { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { color: 'text-teal-400', bg: 'bg-teal-500/10' },
        { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { color: 'text-blue-400', bg: 'bg-blue-500/10' },
      ]
      return { ...stat, ...colors[i] }
    })
  }, [activeMiner, hecPrice, t])

  if (!loading && miners.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-[#1a2538]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-4">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{t('home.minerSection.label')}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-4">{t('home.minerSection.title')}</h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">{t('home.minerSection.subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-12 flex-wrap">
              {miners.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active === i ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {activeMiner && (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/20 p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]" />
                  <div className="flex justify-center mb-8">
                    <div className="relative w-48 h-48">
                      <MinerImage
                        minerTypeId={activeMiner.id}
                        price={parseFloat(activeMiner.price)}
                        image={activeMiner.image}
                        className="object-contain w-full h-full drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                      />
                    </div>
                  </div>
                  <div className="relative text-center">
                    <h3 className="text-5xl font-extrabold text-white mb-2">{activeMiner.name}</h3>
                    <p className="text-gray-500 mb-6">{t('home.minerSection.contract')}</p>
                    <div className="text-6xl font-extrabold text-white mb-1">
                      ${parseFloat(activeMiner.price).toLocaleString()}
                    </div>
                    <p className="text-gray-500 mb-8">{t('home.minerSection.claimInfo')}</p>
                    <Link
                      to={`/miners/${activeMiner.id}`}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all"
                    >
                      {t('home.minerSection.startMining')}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${stat.color} ${stat.bg} flex items-center justify-center`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0" />
                          </svg>
                        </div>
                        <span className="text-gray-400">{stat.label}</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
