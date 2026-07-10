import { useI18n } from '../../i18n/I18nProvider'

interface Props {
  onApprove: () => void
  onDismiss: () => void
}

export default function ApprovePromptBanner({ onApprove, onDismiss }: Props) {
  const { messages } = useI18n()
  const w = messages.walletApprove

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-200">{w.title}</p>
        <p className="text-xs text-amber-200/70 mt-0.5">{w.subtitle}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-2 rounded-lg text-xs text-gray-300 border border-white/10 hover:bg-white/5"
        >
          {w.cancel}
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
        >
          {w.confirm}
        </button>
      </div>
    </div>
  )
}
