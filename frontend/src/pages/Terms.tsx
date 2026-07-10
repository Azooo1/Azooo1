import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'

export default function Terms() {
  const { messages, t } = useI18n()

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h1 className="text-4xl font-extrabold text-white mb-2">{messages.terms.title}</h1>
        <p className="text-gray-500 text-sm mb-12">{messages.terms.lastUpdated}</p>

        <div className="space-y-10">
          {messages.terms.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
              <p className="text-gray-400 leading-relaxed">{section.content}</p>
              {section.items && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-gray-400 text-sm">
                      <span className="text-emerald-400 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← {t('common.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
