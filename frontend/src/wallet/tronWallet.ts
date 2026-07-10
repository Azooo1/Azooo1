import { connectTronWalletById, connectTronWalletAuto } from './tronProviders'

export { detectTronWallets, hasTronWallet, connectTronWalletById } from './tronProviders'
export type { TronWalletId, TronWalletOption } from './tronProviders'

/** @deprecated 使用 connectTronWalletById / connectTronWalletAuto */
export async function connectTronWallet(): Promise<string> {
  const result = await connectTronWalletAuto()
  if (result.type === 'pick') {
    const address = await connectTronWalletById(result.wallets[0].id)
    return address
  }
  return result.address
}
