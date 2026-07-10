interface Trc20Contract {
  balanceOf: (address: string) => { call: (opts?: Record<string, unknown>) => Promise<unknown> }
  allowance: (owner: string, spender: string) => { call: (opts?: Record<string, unknown>) => Promise<unknown> }
  approve: (spender: string, amount: string) => {
    send: (options?: Record<string, unknown>) => Promise<unknown>
  }
}

interface TronWebInstance {
  ready?: boolean
  defaultAddress?: {
    base58?: string
    hex?: string
  }
  trx: {
    getBalance: (address: string) => Promise<number>
    sign: (transaction: unknown) => Promise<{ txID?: string; [key: string]: unknown }>
    sendRawTransaction: (signed: unknown) => Promise<{ result?: boolean; txid?: string; message?: string }>
  }
  transactionBuilder: {
    triggerSmartContract: (
      contract: string,
      functionSelector: string,
      options: Record<string, unknown>,
      parameters: Array<{ type: string; value: string }>,
      issuerAddress: string,
    ) => Promise<{ transaction?: { txID?: string; [key: string]: unknown } }>
  }
  contract: () => {
    at: (address: string) => Promise<Trc20Contract>
  }
}

interface TronLinkInstance {
  request: (args: { method: string; params?: unknown }) => Promise<{
    code: number
    message?: string
    transaction?: Record<string, unknown>
    result?: Record<string, unknown>
  }>
  disconnect?: () => Promise<void>
}

interface TokenPocketTronInstance {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
  disconnect?: () => Promise<void>
}

interface TokenPocketInstance {
  tron?: TokenPocketTronInstance
  tronWeb?: TronWebInstance
}

interface Window {
  tronWeb?: TronWebInstance
  tronLink?: TronLinkInstance
  tokenpocket?: TokenPocketInstance
  ethereum?: {
    isMetaMask?: boolean
    isTokenPocket?: boolean
    request?: (args: { method: string }) => Promise<unknown>
  }
}
