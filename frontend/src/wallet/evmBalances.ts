import { createPublicClient, erc20Abi, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { ETH_USDC_CONTRACT, ethTransport } from './config'

const client = createPublicClient({
  chain: mainnet,
  transport: ethTransport,
})

export async function fetchUsdcAllowance(owner: string, spender: string): Promise<bigint> {
  const allowance = await client.readContract({
    address: ETH_USDC_CONTRACT,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner as Address, spender as Address],
  })
  return allowance
}
