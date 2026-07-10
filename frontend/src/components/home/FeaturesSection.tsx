import { FEATURE_IMAGES } from '../../data/site'
import { useI18n } from '../../i18n/I18nProvider'

export default function FeaturesSection() {
  const { messages, t } = useI18n()

  return (
    <section className="py-24 bg-[#1e2b3e]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-20">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{t('home.features.label')}</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">{t('home.features.title')}</h2>
        </div>
        <div className="space-y-24">
          {messages.home.features.items.map((feature, i) => {
            const meta = FEATURE_IMAGES[i]
            return (
              <div key={feature.title} className="grid lg:grid-cols-2 gap-12 items-center">
                <div className={meta.reverse ? 'lg:order-2' : ''}>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" /></svg>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">{feature.description}</p>
                  <div className="flex gap-8">
                    {feature.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-3xl overflow-hidden border border-white/[0.06] h-72 relative ${meta.reverse ? 'lg:order-1' : ''}`}>
                  <img src={meta.image} alt={feature.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e2b3e]/60 to-transparent" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
