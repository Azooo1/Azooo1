import type { MinerTypeItem } from '../../api/client'
import { getMinerTier } from '../../utils/minerTheme'
import MinerImage from './MinerImage'
import { minerDisplayName } from './minerUtils'

interface Props {
  open: boolean
  minerTypes: MinerTypeItem[]
  macPrice: number
  locale: string
  onClose: () => void
  onSelect: (type: MinerTypeItem) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export default function MinerShopModal({ open, minerTypes, macPrice, locale: _locale, onClose, onSelect, t }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161b22] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('miners.shop.title')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {minerTypes.map((mt) => {
              const price = parseFloat(mt.price)
              const tier = getMinerTier(price)
              const daily = parseFloat(mt.dailyOutput) || 0
              return (
                <div
                  key={mt.id}
                  className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-lg ${tier.glow}`}
                >
                  <div className="flex justify-center h-28 mb-3">
                    <MinerImage minerTypeId={mt.id} price={price} image={mt.image} className="h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center">{minerDisplayName(mt)}</h3>
                  <p className={`text-center text-2xl font-bold text-emerald-400 mt-1`}>${price.toLocaleString()}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <span className="text-gray-400">{t('miners.shop.dailyOutput')}</span>
                      <span className="text-white font-medium">{daily} HEC</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                      <span className="text-gray-400">{t('miners.shop.dailyRevenue')}</span>
                      <span className="text-emerald-400 font-medium">${(daily * macPrice).toFixed(2)}</span>
                    </div>
                    {mt.validityDays && (
                      <p className="text-xs text-gray-500 text-center">
                        {t('miners.shop.validityDays', { days: mt.validityDays })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(mt)}
                    className={`w-full mt-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${tier.gradient} hover:opacity-90 transition-opacity`}
                  >
                    {t('miners.shop.apply')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
