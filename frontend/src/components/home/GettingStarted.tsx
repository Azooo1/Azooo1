import { ASSET_BASE } from '../../data/site'
import { useI18n } from '../../i18n/I18nProvider'

export default function GettingStarted() {
  const { messages, t } = useI18n()

  return (
    <section className="py-24 bg-[#172030]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-12">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{t('home.gettingStarted.label')}</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">{t('home.gettingStarted.title')}</h2>
          <p className="text-gray-400 mt-3 text-lg">{t('home.gettingStarted.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
              <div className="aspect-video relative bg-[#0d1520]">
                <img src={`${ASSET_BASE}/videos/getting-started-poster.jpg`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `${ASSET_BASE}/images/features/ai-hashrate.png` }} />
                <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group cursor-pointer" aria-label="play">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: 'color-mix(in srgb, #10b981 90%, black)', boxShadow: '0 0 40px color-mix(in srgb, #10b981 40%, transparent)' }}>
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-2">
            {messages.home.gettingStarted.steps.map((step, i) => (
              <div key={step.num} className="relative flex gap-4">
                {i < messages.home.gettingStarted.steps.length - 1 && (
                  <div className="absolute left-5 top-14 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, rgba(16,185,129,0.3), transparent)' }} />
                )}
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #10b981, #0d9668)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>{step.num}</div>
                </div>
                <div className="flex-1 rounded-xl p-4 transition-colors bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]">
                  <h3 className="font-semibold text-white mb-1.5">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
