import { Link } from 'react-router-dom'
import { MINERS } from '../mock/miners-catalog'
import { useI18n } from '../i18n/I18nProvider'

export default function Whitepaper() {
  const { messages, t } = useI18n()
  const wp = messages.whitepaper
  const { intro, tokenomics, mining, roadmap } = wp.sections

  const tokenStats = [
    { label: tokenomics.symbol, value: tokenomics.symbolValue },
    { label: tokenomics.totalSupply, value: tokenomics.totalSupplyValue },
    { label: tokenomics.network, value: tokenomics.networkValue },
    { label: tokenomics.initialPrice, value: tokenomics.initialPriceValue },
  ]

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{wp.title}</h1>
          <p className="text-gray-400 text-lg">{wp.subtitle}</p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {wp.version}
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">1</span>
            {intro.title}
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">{intro.content}</p>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h4 className="text-emerald-400 font-semibold mb-2">{intro.missionTitle}</h4>
            <p className="text-gray-400">{intro.mission}</p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">2</span>
            {tokenomics.title}
          </h2>
          <p className="text-gray-400 leading-relaxed mb-8">{tokenomics.content}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tokenStats.map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-2xl font-bold text-emerald-400 mb-1">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-white mb-4">{tokenomics.distributionTitle}</h3>
          <div className="space-y-3">
            {tokenomics.distribution.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{d.label}</span>
                  <span className="text-white font-medium">{d.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">3</span>
            {mining.title}
          </h2>
          <p className="text-gray-400 leading-relaxed mb-8">{mining.content}</p>
          <div className="grid md:grid-cols-3 gap-4">
            {MINERS.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                <h4 className="text-xl font-bold text-white mb-2">{m.name}</h4>
                <p className="text-emerald-400 font-semibold mb-1">${m.price.toLocaleString()} USDC</p>
                <p className="text-gray-500 text-sm">{mining.dailyApprox} {m.dailyOutput}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">4</span>
            {roadmap.title}
          </h2>
          <div className="space-y-4">
            {roadmap.items.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${item.done ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-gray-400'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 pb-4 border-b border-white/[0.06] last:border-0">
                  <h4 className="text-white font-semibold mb-1">{item.phase}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm">← {t('common.backHome')}</Link>
        </div>
      </div>
    </div>
  )
}
