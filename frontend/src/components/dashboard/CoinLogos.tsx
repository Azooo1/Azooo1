export function HecLogo({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      H
    </div>
  )
}

export function UsdcLogo({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full bg-[#2775CA]/20 border border-[#2775CA]/40 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-[#2775CA] font-bold" style={{ fontSize: size * 0.36 }}>
        $
      </span>
    </div>
  )
}
