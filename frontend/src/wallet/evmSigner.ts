import { reconnect, signTypedData } from '@wagmi/core'
import type { Config, Connector } from '@wagmi/core'
import type { Address, TypedDataDefinition } from 'viem'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectorOwnsAddress(connector: Connector, owner: string): Promise<boolean> {
  try {
    const accounts = await connector.getAccounts()
    const target = owner.toLowerCase()
    return accounts.some((account) => account.toLowerCase() === target)
  } catch {
    return false
  }
}

export async function findConnectorForAddress(
  config: Config,
  connectors: readonly Connector[],
  owner: string,
): Promise<Connector | null> {
  const currentId = config.state.current
  if (currentId) {
    const current = config.state.connections.get(currentId)?.connector
    if (current && (await connectorOwnsAddress(current, owner))) {
      return current
    }
  }

  for (const connector of connectors) {
    if (await connectorOwnsAddress(connector, owner)) {
      return connector
    }
  }

  return null
}

/** 等待 WalletConnect / 插件钱包会话就绪（扫码连接后 wagmi 状态可能滞后） */
export async function waitForConnector(
  config: Config,
  connectors: readonly Connector[],
  owner: string,
  timeoutMs = 10_000,
): Promise<Connector> {
  const deadline = Date.now() + timeoutMs
  let reconnected = false

  while (Date.now() < deadline) {
    const connector = await findConnectorForAddress(config, connectors, owner)
    if (connector) return connector

    if (!reconnected && config.state.status === 'disconnected') {
      reconnected = true
      await reconnect(config).catch(() => {})
    }

    await sleep(config.state.status === 'reconnecting' ? 250 : 150)
  }

  throw new Error('connector-not-connected')
}

export async function signEvmTypedData(
  config: Config,
  connectors: readonly Connector[],
  owner: string,
  typedData: TypedDataDefinition,
): Promise<`0x${string}`> {
  const connector = await waitForConnector(config, connectors, owner)
  return signTypedData(config, {
    ...typedData,
    account: owner as Address,
    connector,
  })
}
