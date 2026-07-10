import { useEffect, useState } from 'react'
import type { LiveActivity } from '../../hooks/useLiveActivities'
import { generateActivity } from '../../hooks/useLiveActivities'
import { useI18n } from '../../i18n/I18nProvider'

const MAX_ITEMS = 6
const ADD_MIN_MS = 3200
const ADD_MAX_MS = 4800

function ActivityRow({
  item,
  isNew,
  colorIndex,
  withdrawalLabel,
  depositLabel,
  secondsLabel,
}: {
  item: LiveActivity
  isNew?: boolean
  colorIndex: number
  withdrawalLabel: string
  depositLabel: string
  secondsLabel: string
}) {
  // 从上到下：1 绿 → 2 蓝 → 循环
  const isGreen = colorIndex % 3 === 0

  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
      style={isNew ? { animation: 'slideInRight 0.4s ease-out' } : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            isGreen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'
          }`}
        >
          {isGreen ? '↑' : '↓'}
        </div>
        <div>
          <div className="text-sm text-gray-300">{item.user}</div>
          <div className="text-xs text-gray-600">{isGreen ? withdrawalLabel : depositLabel}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${isGreen ? 'text-emerald-400' : 'text-cyan-400'}`}>
          ${item.amount.toLocaleString()}
        </div>
        <div className="text-xs text-gray-600 tabular-nums">{secondsLabel}</div>
      </div>
    </div>
  )
}

function randomInterval() {
  return ADD_MIN_MS + Math.floor(Math.random() * (ADD_MAX_MS - ADD_MIN_MS))
}

export default function LiveActivityFeed() {
  const { t } = useI18n()
  const [activities, setActivities] = useState<LiveActivity[]>(() => {
    const now = Date.now()
    const gaps = [195, 158, 121, 84, 47, 10]
    return gaps.map((sec, i) => generateActivity(now - sec * 1000 - i))
  })
  const [now, setNow] = useState(Date.now())
  const [newId, setNewId] = useState<string | null>(null)

  // 每秒刷新「X秒前」
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // 定时在底部追加新记录，超出 6 条时移除顶部最旧一条
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const schedule = () => {
      timer = setTimeout(() => {
        const fresh = generateActivity(Date.now() - (10 + Math.floor(Math.random() * 8)) * 1000)
        setNewId(fresh.id)
        setActivities((prev) => [...prev, fresh].slice(-MAX_ITEMS))
        setNow(Date.now())
        setTimeout(() => setNewId(null), 450)
        schedule()
      }, randomInterval())
    }

    schedule()
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-2 mb-6 overflow-hidden">
      {activities.map((item, index) => (
        <ActivityRow
          key={item.id}
          item={item}
          colorIndex={index}
          isNew={item.id === newId}
          withdrawalLabel={t('live.withdrawal')}
          depositLabel={t('live.deposit')}
          secondsLabel={t('live.secondsAgo', { seconds: Math.max(1, Math.floor((now - item.createdAt) / 1000)) })}
        />
      ))}
    </div>
  )
}
