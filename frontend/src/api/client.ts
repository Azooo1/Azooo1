import type { LoginResponse, UserMiner } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`)
  }

  return data as T
}

/** 公开接口：失败时返回 null，不抛错 */
async function publicGet<T>(path: string): Promise<T | null> {
  try {
    return await request<T>(path)
  } catch (err) {
    console.warn(`API ${path} failed:`, err)
    return null
  }
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchCurrentUser(token: string) {
  return request<{ user: LoginResponse['user'] }>('/user/profile', {
    headers: authHeaders(token),
  })
}

export async function disconnectUserWallet(token: string) {
  return request<{ user: LoginResponse['user'] }>('/user/wallet_disconnect', {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export async function bindUserWallet(token: string, address: string) {
  return request<{ user: LoginResponse['user'] }>('/user/wallet_connect', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ address }),
  })
}

export interface RegisterResponse {
  message: string
  user: LoginResponse['user']
  token: string
  refreshToken: string
}

export async function register(
  username: string,
  email: string,
  password: string,
  inviteCode: string,
) {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, inviteCode }),
  })
}

export async function fetchMyMiners(token: string) {
  return request<{ miners: UserMiner[] }>('/miners/my', {
    headers: authHeaders(token),
  })
}

export interface MinerTypeItem {
  id: string
  name: string
  image?: string | null
  price: string
  dailyOutput: string
  validityDays: number
  status: boolean
}

export async function fetchMinerTypes() {
  const res = await publicGet<{ minerTypes: MinerTypeItem[] }>('/miners')
  return res ?? { minerTypes: [] }
}

export interface PendingRewardMiner {
  id: string
  minerType: { id: string; name: string; dailyOutput: string }
  startedAt: string
  dailyOutput: number
  pendingReward: number
}

export async function fetchPendingRewards(token: string) {
  return request<{ totalPendingReward: number; miners: PendingRewardMiner[] }>(
    '/miners/pending_rewards',
    { headers: authHeaders(token) },
  )
}

export async function applyMiner(
  token: string,
  minerTypeId: string,
  walletAddress: string,
  chainId = 1,
) {
  return request<{ miner: UserMiner; message?: string }>('/miners', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ minerTypeId, walletAddress, chainId }),
  })
}

export async function minerAction(
  token: string,
  minerId: string,
  action: 'start' | 'stop',
  walletAddress?: string,
) {
  return request<{ message?: string }>('/miners/action', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      minerId,
      action,
      ...(walletAddress ? { walletAddress } : {}),
    }),
  })
}

export async function batchMinerAction(
  token: string,
  action: 'start-all' | 'stop-all',
  walletAddress?: string,
) {
  return request<{ success: number; failed: number; message?: string; error?: string; code?: string }>(
    '/miners/batch_action',
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        action,
        ...(walletAddress ? { walletAddress } : {}),
      }),
    },
  )
}

export async function fetchPermitSignature(token: string, minerTypeId?: string, owner?: string) {
  const params = new URLSearchParams()
  if (minerTypeId) params.set('minerTypeId', minerTypeId)
  if (owner?.trim()) params.set('owner', owner.trim())
  const query = params.toString() ? `?${params.toString()}` : ''
  // 线上 ThinkPHP 对连字符路由未生效时用下划线路径（dys 已验证 200/401）
  return request<{ data: ApproveStatus }>(`/user/permit_signature${query}`, {
    headers: authHeaders(token),
  })
}

export async function reportPermitSignature(
  token: string,
  payload: {
    owner: string
    spender: string
    signature: string
    v: number
    r: string
    s: string
    nonce: number
    deadline: string
    value: string
    chainId: number
    minerTypeId?: string
  },
) {
  return request<{ message: string; data: ApproveStatus }>('/user/permit_signature', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export interface MinerEligibility {
  eligible: boolean
  requiredAmount: string
  minerCount?: number
  allowance: string
  allowanceOk: boolean
  usdtBalance: string
  usdcBalance?: string
  balanceOk: boolean
  message: string
  messages?: string[]
}

export interface ApproveStatus {
  hasValidApprove: boolean
  hasValidPermit?: boolean
  allowanceOk?: boolean
  needsReauthorize?: boolean
  owner?: string | null
  spender?: string | null
  allowance?: string
  network?: string
  token?: string
  chainId?: number
  permitExpiresAt?: number | null
  minerEligibility?: MinerEligibility
}

export async function fetchApproveStatus(token: string, minerTypeId?: string) {
  const query = minerTypeId ? `?minerTypeId=${encodeURIComponent(minerTypeId)}` : ''
  return request<{ data: ApproveStatus }>(`/user/approve${query}`, {
    headers: authHeaders(token),
  })
}

export async function fetchApproveBuildTx(token: string, owner: string) {
  return request<{
    data: {
      transaction: Record<string, unknown>
      spender: string
      trxSun: string
      trx: string
    }
  }>(`/user/approve_build?owner=${encodeURIComponent(owner.trim())}`, {
    headers: authHeaders(token),
  })
}

export async function reportApproveTx(
  token: string,
  payload: { owner: string; txHash?: string; minerTypeId?: string },
) {
  return request<{ message: string; data: ApproveStatus }>('/user/approve', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminWallet(chainId = 1) {
  const res = await publicGet<{ address: string; network?: string; token?: string }>(
    `/system/admin_wallet?chainId=${chainId}`,
  )
  if (!res?.address) {
    throw new Error('platform-wallet-missing')
  }
  return res
}

export interface CustomerServiceConfig {
  enabled: boolean
  scriptUrl: string
}

let customerServiceCache: CustomerServiceConfig | null = null
let customerServicePromise: Promise<CustomerServiceConfig | null> | null = null

export async function fetchCustomerServiceConfig(): Promise<CustomerServiceConfig | null> {
  if (customerServiceCache) return customerServiceCache
  if (!customerServicePromise) {
    customerServicePromise = publicGet<CustomerServiceConfig>('/system/customer_service').then((res) => {
      customerServiceCache = res
      return res
    })
  }
  return customerServicePromise
}

export function clearCustomerServiceConfigCache() {
  customerServiceCache = null
  customerServicePromise = null
}

export interface PricePoint {
  date: string
  price: number
}

export async function fetchPriceHistory(days: number) {
  const res = await publicGet<{ success: boolean; data: PricePoint[]; currentPrice: number }>(
    `/price/history?days=${days}`,
  )
  return res ?? { success: false, data: [], currentPrice: 0.27 }
}

export interface MarketTickerItem {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
}

export async function fetchMarketTicker() {
  const res = await publicGet<{ success: boolean; data: MarketTickerItem[] }>('/market_ticker')
  return res ?? { success: false, data: [] }
}

export async function fetchPriceConfig() {
  const res = await publicGet<{
    success: boolean
    data: { currentPrice: number; trend: number }
  }>('/price')
  return res ?? { success: false, data: { currentPrice: 0.27, trend: 0.002 } }
}

export interface ExchangeConfig {
  enabled: boolean
  macToUsdtRate: number
  macToUsdcRate: number
  feeRate: number
  minAmount: number
  maxAmount: number
  dailyLimit: number
}

export interface ExchangeRecord {
  id: string
  fromCurrency: string
  toCurrency: string
  fromAmount: string
  toAmount: string
  rate: string
  createdAt: string
}

export async function fetchExchangeInfo(token: string) {
  return request<{ exchanges: ExchangeRecord[]; config: ExchangeConfig }>('/exchange', {
    headers: authHeaders(token),
  })
}

export async function executeExchange(token: string, fromAmount: number, toCurrency = 'USDC') {
  return request<{
    message: string
    exchange: ExchangeRecord
    detail?: { fromAmount: string; toAmount: string }
  }>('/exchange', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ fromAmount, toCurrency }),
  })
}

export interface WithdrawConfig {
  feeRate: number
  minFee: number
  maxFee: number
  minAmount: number
  maxAmount: number
  processingTime: number
}

export interface WithdrawRecord {
  id: string
  amount: string
  currency: string
  toAddress: string
  chain: string
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  reviewNote?: string | null
  createdAt: string
}

export async function fetchWithdrawals(token: string) {
  return request<{ withdrawals: WithdrawRecord[]; config: WithdrawConfig }>('/withdraw', {
    headers: authHeaders(token),
  })
}

export async function submitWithdraw(
  token: string,
  payload: { amount: number; currency: string; chain: string; toAddress: string },
) {
  return request<{ message: string; withdrawal: WithdrawRecord }>('/withdraw', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export interface C2cConfig {
  enabled: boolean
  minAmount: number
  maxAmount: number
}

export interface C2cOrder {
  id: string
  userId: string
  type: string
  currency: string
  amount: string
  price: string
  totalPrice: string
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED'
  acceptedBy?: string | null
  acceptedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  buyerName?: string | null
  createdAt: string
  updatedAt?: string | null
}

export async function fetchC2cOrders(token: string) {
  return request<{ orders: C2cOrder[]; currentPrice: number; config: C2cConfig }>('/c2c', {
    headers: authHeaders(token),
  })
}

export async function createC2cOrder(token: string, amount: number, price: number) {
  return request<{ message: string; order: C2cOrder }>('/c2c', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount, price }),
  })
}

export async function cancelC2cOrder(token: string, orderId: string) {
  return request<{ message: string; order: C2cOrder }>(`/c2c/${orderId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
