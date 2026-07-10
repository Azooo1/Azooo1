import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { fetchMinerTypes, fetchPriceConfig } from '../api/client'
import type { MinerTypeItem } from '../api/client'
import { useI18n } from '../i18n/I18nProvider'
import MinerImage from '../components/miners/MinerImage'
import { buildMinerStats } from '../utils/minerDisplay'

export default function MinerDetail() {
  const { id } = useParams()
  const { t } = useI18n()
  const [miners, setMiners] = useState<MinerTypeItem[]>([])
  const [hecPrice, setHecPrice] = useState(0.27)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchMinerTypes(), fetchPriceConfig()])
      .then(([typesRes, priceRes]) => {
        if (cancelled) return
        setMiners(typesRes.minerTypes ?? [])
        setHecPrice(priceRes.data?.currentPrice ?? 0.27)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const miner = miners.find((m) => m.id === id)

  const stats = useMemo(() => {
    if (!miner) return []
    return buildMinerStats(
      miner,
      hecPrice,
      {
        dailyOutput: t('home.minerSection.dailyOutput'),
        dailyEarnings: t('home.minerSection.dailyEarnings'),
        monthlyEarnings: t('home.minerSection.monthlyEarnings'),
        validity: t('home.minerSection.validity'),
      },
      t('miners.shop.validityDays', { days: miner.validityDays }),
    )
  }, [miner, hecPrice, t])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!miner) return <Navigate to="/miners" replace />

  return (
    <div className="pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <Link to="/miners" className="text-gray-500 hover:text-emerald-400 text-sm mb-8 inline-block">
          {t('minerDetail.backToList')}
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/20 p-10">
            <div className="flex justify-center mb-8">
              <MinerImage
                minerTypeId={miner.id}
                price={parseFloat(miner.price)}
                image={miner.image}
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white mb-2">{miner.name}</h1>
              <p className="text-gray-500 mb-4">{t('home.minerSection.contract')}</p>
              <div className="text-5xl font-extrabold text-white mb-2">${parseFloat(miner.price).toLocaleString()}</div>
              <p className="text-gray-500 text-sm">{t('home.minerSection.claimInfo')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              >
                <span className="text-gray-400">{stat.label}</span>
                <span className="text-white font-bold text-lg">{stat.value}</span>
              </div>
            ))}

            <Link
              to="/miners"
              className="block w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all mt-4"
            >
              {t('common.startMining')}
            </Link>

            <p className="text-gray-600 text-xs text-center">
              {t('minerDetail.loginHintBefore')}
              <Link to="/login" className="text-emerald-400">
                {t('minerDetail.login')}
              </Link>
              {t('minerDetail.loginHintAfter')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
