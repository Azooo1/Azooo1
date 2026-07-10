import { utils } from 'tronweb'
import { createTronWeb } from './tronGrid'

const HEX_ADDR_RE = /^41[0-9a-fA-F]{40}$/
const ADDRESS_KEYS = ['owner_address', 'contract_address', 'to_address', 'account_address'] as const

function toHexAddress(tronWeb: ReturnType<typeof createTronWeb>, addr: unknown): string | undefined {
  if (typeof addr !== 'string' || !addr.trim()) return undefined
  const value = addr.trim()
  if (HEX_ADDR_RE.test(value)) return value.toLowerCase()
  try {
    return tronWeb.address.toHex(value).toLowerCase()
  } catch {
    return undefined
  }
}

function hexifyContractAddresses(
  tronWeb: ReturnType<typeof createTronWeb>,
  rawData: { contract?: Array<{ parameter?: { value?: Record<string, unknown> } }> },
) {
  const value = rawData.contract?.[0]?.parameter?.value
  if (!value || typeof value !== 'object') return

  for (const key of ADDRESS_KEYS) {
    if (typeof value[key] === 'string') {
      const hex = toHexAddress(tronWeb, value[key])
      if (hex) value[key] = hex
    }
  }
}

function rebuildTransactionIds(tx: Record<string, unknown>) {
  const { txJsonToPb, txPbToTxID, txPbToRawDataHex } = utils.transaction
  const pb = txJsonToPb(tx)
  tx.txID = txPbToTxID(pb).replace(/^0x/, '')
  tx.raw_data_hex = txPbToRawDataHex(pb).toLowerCase()
}

/**
 * WalletConnect v2 Tron 规范：visible=false、hex 地址、txID 与 raw_data_hex 一致。
 * TokenPocket 扫码协议同样使用 visible=false + useTronHeader（见 tronWalletConnect.ts）。
 */
export function canonicalizeWcTransaction(transaction: object, owner?: string): Record<string, unknown> {
  const tronWeb = createTronWeb(owner)
  const tx = JSON.parse(JSON.stringify(transaction)) as Record<string, unknown>

  if (Array.isArray(tx.signature) && tx.signature.length === 0) {
    delete tx.signature
  }

  const rawData = tx.raw_data
  if (rawData && typeof rawData === 'object') {
    hexifyContractAddresses(tronWeb, rawData as { contract?: Array<{ parameter?: { value?: Record<string, unknown> } }> })
  }

  tx.visible = false
  rebuildTransactionIds(tx)
  return tx
}
