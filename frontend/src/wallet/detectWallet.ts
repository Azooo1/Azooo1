import { hasTronWallet } from './tronProviders'

export type DetectedWalletKind = 'tron' | 'none'

export { detectTronWallets, hasTronWallet } from './tronProviders'

/** 是否检测到支持 TRON 的钱包（MetaMask / TokenPocket / TronLink 等） */
export function detectWalletKind(): DetectedWalletKind {
  return hasTronWallet() ? 'tron' : 'none'
}
