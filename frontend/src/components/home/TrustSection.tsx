import { PARTNERS } from '../../data/site'
import { useI18n } from '../../i18n/I18nProvider'

export default function TrustSection() {
  const { t } = useI18n()

  const stats = [
    { value: '3.6M+', label: t('home.trust.registeredUsers') },
    { value: '$180M+', label: t('home.trust.totalPaidOut') },
    { value: '180+', label: t('home.trust.countries') },
    { value: '0', label: t('home.trust.securityIncidents') },
  ]

  return (
    <section className="py-20 bg-[#131c2a] border-y border-gray-700/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{t('home.trust.label')}</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">{t('home.trust.title')}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 mb-16">
          {PARTNERS.map((name) => (
            <div key={name} className="group cursor-default">
              <span className="text-2xl md:text-3xl text-gray-600 group-hover:text-gray-300 transition-colors duration-300 font-black tracking-wider">{name}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
