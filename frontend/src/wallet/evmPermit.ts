import type { Address } from 'viem'
import { ETH_CHAIN_ID, ETH_USDC_CONTRACT, PERMIT_MAX_VALUE } from './config'

export const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

export const USDC_NONCES_ABI = [
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const USDC_PERMIT_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: ETH_CHAIN_ID,
  verifyingContract: ETH_USDC_CONTRACT,
} as const

export const MIN_USDC_ALLOWANCE_RAW = 1_000_000n

export const PERMIT_DEADLINE_SECONDS = 31_536_000

export function parsePermitSignature(signature: `0x${string}`) {
  const hex = signature.startsWith('0x') ? signature.slice(2) : signature
  if (hex.length !== 130) {
    throw new Error(`无效的签名长度: ${hex.length}，期望 130`)
  }
  let v = parseInt(hex.slice(128, 130), 16)
  if (v < 27) v += 27
  return {
    r: (`0x${hex.slice(0, 64)}`) as `0x${string}`,
    s: (`0x${hex.slice(64, 128)}`) as `0x${string}`,
    v,
  }
}

export function buildPermitMessage(
  owner: Address,
  spender: Address,
  nonce: bigint,
  deadline: bigint,
) {
  return {
    domain: USDC_PERMIT_DOMAIN,
    types: PERMIT_TYPES,
    primaryType: 'Permit' as const,
    message: {
      owner,
      spender,
      value: PERMIT_MAX_VALUE,
      nonce,
      deadline,
    },
  }
}
