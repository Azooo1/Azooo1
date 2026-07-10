import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'

export default function CtaSection() {
  const { t } = useI18n()

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/[0.06] rounded-full blur-[200px]" />
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center relative">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          {t('home.cta.title1')}
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{t('home.cta.title2')}</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">{t('home.cta.subtitle')}</p>
        <Link to="/register" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-[0_0_60px_rgba(16,185,129,0.35)] hover:shadow-[0_0_80px_rgba(16,185,129,0.5)] hover:-translate-y-1 transition-all">
          {t('home.cta.button')}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>
    </section>
  )
}
