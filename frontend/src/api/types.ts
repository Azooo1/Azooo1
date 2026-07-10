export interface User {
  id: string
  username: string
  email: string
  role: string
  macBalance: string
  ethBalance: string
  usdcBalance?: string
  usdtBalance: string
  evmAddress?: string | null
  solanaAddress?: string | null
  inviteCode?: string
}

export interface LoginResponse {
  message: string
  user: User
  token: string
  refreshToken: string
}

export interface MinerType {
  id: string
  name: string
  image?: string | null
  price: string
  dailyOutput: string
  validityDays?: number
  status?: boolean
}

export interface UserMiner {
  id: string
  userId: string
  minerTypeId: string
  status: 'PENDING' | 'RUNNING' | 'STOPPED' | 'REJECTED' | 'EXPIRED' | 'APPROVED'
  startedAt: string | null
  stoppedAt: string | null
  expiresAt: string
  totalMined: number | string
  walletAddress: string
  stopReason?: string | null
  grantSource?: 'user_apply' | 'admin_grant'
  minerType: MinerType
}
