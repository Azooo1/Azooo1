export function isTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)
}

export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isWalletAddress(address: string | null | undefined): address is string {
  if (!address) return false
  return isTronAddress(address) || isEvmAddress(address)
}

export function getWalletChainLabel(address: string): 'Ethereum' | 'TRON' | 'EVM' {
  return isTronAddress(address) ? 'TRON' : 'Ethereum'
}

export function shortenWalletAddress(address: string): string {
  if (address.length <= 14) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
