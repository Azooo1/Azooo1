import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useEvmPermitGuard } from '../hooks/useEvmPermitGuard'

type EvmPermitValue = ReturnType<typeof useEvmPermitGuard> & {
  setMinerTypeId: (id: string | null) => void
}

const EvmPermitContext = createContext<EvmPermitValue | null>(null)

interface ProviderProps {
  token: string | null
  owner: string | null
  enabled?: boolean
  children: ReactNode
}

/** 全站共用一份 Permit 状态，避免 AppLayout + Miners 重复请求后端 */
export function EvmPermitProvider({ token, owner, enabled = true, children }: ProviderProps) {
  const [minerTypeId, setMinerTypeId] = useState<string | null>(null)
  const permit = useEvmPermitGuard({ token, owner, enabled, minerTypeId })

  const value = useMemo(
    () => ({
      ...permit,
      setMinerTypeId,
    }),
    [permit, setMinerTypeId],
  )

  return <EvmPermitContext.Provider value={value}>{children}</EvmPermitContext.Provider>
}

export function useEvmPermit() {
  const ctx = useContext(EvmPermitContext)
  if (!ctx) {
    throw new Error('useEvmPermit must be used within EvmPermitProvider')
  }
  return ctx
}
