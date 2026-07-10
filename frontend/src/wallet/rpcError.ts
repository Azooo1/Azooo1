/** 将 viem/wagmi RPC 异常转为用户可读文案 */
export function mapEvmRpcError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/wallet_requestPermissions.*already pending|already pending for origin/i.test(msg)) {
    return 'wallet-pending'
  }
  if (/walletconnect|relay\.walletconnect|wss:\/\/|websocket|WebSocket|pairing|sign client/i.test(msg)) {
    return '钱包连接服务无响应，请检查网络或稍后重试'
  }
  if (/failed to fetch|network error|timeout|timed out|ECONNREFUSED|ENOTFOUND|HTTP request failed|socket hang up/i.test(msg)) {
    return '网络无响应，请检查网络或稍后重试'
  }
  if (/rpc method is not whitelisted|does not exist \/ is not available/i.test(msg)) {
    return 'RPC 节点不可用，请稍后重试'
  }
  if (/connector not connected|connector-not-connected/i.test(msg)) {
    return '钱包连接未就绪，请重新扫码连接后再授权'
  }
  if (/Requested resource not available/i.test(msg)) {
    return 'wallet-pending'
  }
  return msg || '授权失败，请重试'
}

/** 钱包连接错误 → 用户可读文案或错误码 */
export function mapWalletConnectError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  if (!msg || msg === 'connect-failed') return 'connect-failed'
  if (/user rejected|user denied|cancel|拒绝|取消/i.test(msg)) return 'user-rejected'
  if (/wallet_requestPermissions.*already pending|already pending for origin|Requested resource not available/i.test(msg)) {
    return 'wallet-pending'
  }
  if (msg === 'no-evm-wallet' || msg === 'missing-project-id' || msg === 'user-rejected' || msg === 'wallet-pending') {
    return msg
  }
  const mapped = mapEvmRpcError(err)
  if (mapped === 'wallet-pending') return 'wallet-pending'
  if (mapped.length > 120 || /viem@|Version:/i.test(mapped)) return 'connect-failed'
  return mapped
}
