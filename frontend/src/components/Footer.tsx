import { Link } from 'react-router-dom'
import { ASSET_BASE } from '../data/site'
import { useI18n } from '../i18n/I18nProvider'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-[#080b10] border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white text-lg">H</div>
              <span className="font-bold text-lg text-white">HEC Mining</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{t('footer.desc')}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.products')}</h4>
            <ul className="space-y-3">
              <li><Link to="/miners" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.miners')}</Link></li>
              <li><Link to="/exchange" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.exchange')}</Link></li>
              <li><Link to="/c2c" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.c2c')}</Link></li>
              <li><Link to="/withdraw" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.withdraw')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.resources')}</h4>
            <ul className="space-y-3">
              <li><Link to="/whitepaper" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('nav.whitepaper')}</Link></li>
              <li><Link to="/help" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/terms" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">{t('footer.privacy')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.community')}</h4>
            <div className="flex gap-3">
              {['twitter', 'telegram', 'discord'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-emerald-500/20 border border-gray-700/50 hover:border-emerald-500/30 flex items-center justify-center transition-all" aria-label={social}>
                  <img src={`${ASSET_BASE}/images/social/${social}.png`} alt={social} className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800/50 mt-12 pt-8 text-center">
          <p className="text-gray-600 text-sm">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
