import { useState } from 'react'
import type { HelpIconType } from '../i18n/types'
import { useI18n } from '../i18n/I18nProvider'
import { openSalesmartlyChat } from '../utils/salesmartly'

const ICON_PATHS: Record<HelpIconType, string> = {
  rocket:
    'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
  cube: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  wallet:
    'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
  exchange: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  shield:
    'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
}

function HelpIcon({ icon, className = 'w-6 h-6' }: { icon: HelpIconType; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={ICON_PATHS[icon]} />
    </svg>
  )
}

export default function Help() {
  const { messages, t } = useI18n()
  const categories = messages.help.categories
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const category = categories.find((c) => c.id === activeCategory) ?? categories[0]

  return (
    <>
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/3 w-[400px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{t('help.badge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">{t('help.title')}</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{t('help.subtitle')}</p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            <div className="space-y-2">
              {categories.map((cat) => {
                const active = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setActiveCategory(cat.id); setOpenIndex(null) }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                      active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-white/[0.02] border border-transparent text-gray-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-gray-500'}`}>
                      <HelpIcon icon={cat.icon} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{cat.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{cat.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <HelpIcon icon={category.icon} />
                </div>
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item, i) => {
                  const open = openIndex === i
                  return (
                    <div key={item.q} className={`rounded-2xl border transition-all bg-white/[0.02] ${open ? 'border-emerald-500/20' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                      <button type="button" onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                        <span className="font-medium text-white pr-4">{item.q}</span>
                        <svg className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {open && <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/[0.06] pt-4">{item.a}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] to-teal-500/[0.05] border border-emerald-500/20 p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">{t('help.contactTitle')}</h3>
            <p className="text-gray-400 mb-6">{t('help.contactDesc')}</p>
            <button
              type="button"
              onClick={() => void openSalesmartlyChat()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.411-1.897 4.5 4.5 0 00-.575-4.902 4.5 4.5 0 011.588-1.588 4.5 4.5 0 014.902.575A5.972 5.972 0 0120.97 15.41a9.764 9.764 0 01-.337 2.555z" />
              </svg>
              {t('help.contactBtn')}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
