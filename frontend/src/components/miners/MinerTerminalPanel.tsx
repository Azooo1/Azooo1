import { useEffect, useRef, useState } from 'react'
import { generateTerminalLog } from '../../mock/miner-terminal'

interface Props {
  isRunning: boolean
  minerName?: string
  minerStatus?: string
  t: (key: string) => string
}

function TerminalCursor({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-4 rounded-sm transition-all duration-300 ${
        active ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-gray-600'
      }`}
    />
  )
}

export default function MinerTerminalPanel({ isRunning, minerName, minerStatus, t }: Props) {
  const [lines, setLines] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const wasRunning = useRef(isRunning)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  useEffect(() => {
    if (wasRunning.current && !isRunning && lines.length > 0) {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false })
      setLines((prev) => [
        ...prev,
        `[${time}] system | Mining stopped by user`,
        `[${time}] system | Session ended`,
      ])
    }
    wasRunning.current = isRunning
  }, [isRunning, lines.length])

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      const { type, msg } = generateTerminalLog()
      const time = new Date().toLocaleTimeString('en-US', { hour12: false })
      setLines((prev) => [...prev.slice(-60), `[${time}] ${type} | ${msg}`])
    }, 1000 + Math.random() * 1500)
    return () => clearInterval(timer)
  }, [isRunning])

  const lineStyle = (line: string) => {
    if (line.includes('success') || line.includes('found')) return 'text-green-400'
    if (line.includes('system') || line.includes('error')) return 'text-red-400'
    if (line.includes('core') || line.includes('hash')) return 'text-amber-400'
    if (line.includes('job') || line.includes('block')) return 'text-blue-400'
    return 'text-cyan-300/80'
  }

  return (
    <div className="group rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] overflow-hidden h-[380px] flex flex-col transition-all duration-300 hover:border-white/[0.12]">
      {/* ── 标题栏 ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm shadow-red-500/30" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm shadow-yellow-500/30" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm shadow-green-500/30" />
          </div>
          <span className="text-xs text-gray-500 font-medium tracking-wide">
            {t('miners.terminal.title')}
          </span>
          {minerName && (
            <>
              <span className="text-gray-700">/</span>
              <span className="text-sm text-gray-300 font-semibold truncate max-w-[140px]">
                {minerName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">LIVE</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setLines([])}
            className="text-[11px] text-gray-600 hover:text-gray-300 px-2 py-1 rounded-md hover:bg-white/[0.05] transition-all active:scale-95"
          >
            {t('miners.terminal.clear')}
          </button>
        </div>
      </div>

      {/* ── 终端内容区 ── */}
      <div
        ref={scrollRef}
        className="flex-1 bg-[#0a0e14] p-4 font-mono text-[13px] leading-relaxed overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}
      >
        {!minerStatus ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center transition-all duration-300 group-hover:scale-105">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-sm text-gray-600">{t('miners.terminal.selectMiner')}</p>
            </div>
          </div>
        ) : lines.length === 0 && isRunning ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span className="text-gray-500 text-sm">{t('miners.terminal.connecting')}</span>
            </div>
          </div>
        ) : lines.length === 0 && !isRunning ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">{t('miners.status.stopped')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {lines.map((line, i) => (
              <div key={`${line}-${i}`} className={`${lineStyle(line)} hover:opacity-90 transition-opacity`}>
                {line}
              </div>
            ))}
            <div className="inline-flex items-center gap-1 pt-0.5">
              <span className="text-gray-600 font-mono text-xs">$</span>
              <TerminalCursor active={isRunning} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
