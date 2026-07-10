import { TronWeb } from 'tronweb'

const API_KEY = 'b70dd8af-8ebe-496d-9f7a-44b1e764883e'
const OWNER = process.argv[2] || 'TWK1GqrVtLDdRp8jvnyngWNMrHEMYEaygj'
const SPENDER = process.argv[3] || 'TWDyvDW5D5uMMU6nYrWwHUyWuJt9bWHDu6'
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  headers: { 'TRON-PRO-API-KEY': API_KEY },
})

function padAddr(addr) {
  const hex = tronWeb.address.toHex(addr).replace(/^41/, '')
  return hex.toLowerCase().padStart(64, '0')
}

function decodeMsg(msg) {
  if (typeof msg !== 'string') return String(msg)
  return /^[0-9a-fA-F]+$/.test(msg) ? Buffer.from(msg, 'hex').toString() : msg
}

async function post(path, body) {
  const res = await fetch(`https://api.trongrid.io${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'TRON-PRO-API-KEY': API_KEY },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function main() {
  const trxSun = await tronWeb.trx.getBalance(OWNER)
  const resources = await post('/wallet/getaccountresource', { address: OWNER, visible: true })

  console.log('=== 账户 ===')
  console.log('owner:', OWNER)
  console.log('spender:', SPENDER)
  console.log('TRX:', Number(trxSun) / 1e6)
  console.log('energy limit:', resources.EnergyLimit ?? 0, 'used:', resources.EnergyUsed ?? 0)
  console.log('freeNet:', (resources.freeNetLimit ?? 0) - (resources.freeNetUsed ?? 0))

  const built = await tronWeb.transactionBuilder.triggerSmartContract(
    USDT,
    'approve(address,uint256)',
    { feeLimit: 200_000_000, callValue: 0 },
    [
      { type: 'address', value: SPENDER },
      { type: 'uint256', value: MAX },
    ],
    OWNER,
  )

  const tx = built.transaction
  const result = built.result || {}

  console.log('\n=== 1. 链上构建 approve（模拟前端 triggerSmartContract）===')
  console.log('build_ok:', !!tx)
  console.log('result.result:', result.result)
  if (result.message) console.log('result.message:', decodeMsg(result.message))

  if (!tx) {
    console.log('\n结论: 构建失败 → 手机收到畸形/空交易会导致 TP 模拟失败、手续费 ~')
    console.log(JSON.stringify(built, null, 2).slice(0, 2500))
    return
  }

  const data = tx?.raw_data?.contract?.[0]?.parameter?.value?.data
  console.log('selector:', data?.slice(0, 8), '(expect 095ea7b3)')
  console.log('data_len:', data?.length, '(expect 136+)')
  console.log('txID:', tx.txID)
  console.log('expires_in_sec:', Math.round(((tx.raw_data?.expiration || 0) - Date.now()) / 1000))

  const parameter = padAddr(SPENDER) + BigInt(MAX).toString(16).padStart(64, '0')
  const est = await post('/wallet/estimateenergy', {
    owner_address: OWNER,
    contract_address: USDT,
    function_selector: 'approve(address,uint256)',
    parameter,
    visible: true,
  })

  console.log('\n=== 2. estimateenergy（接近 TP 手续费估算）===')
  if (est.Error) {
    console.log('estimate_failed:', est.Error)
    console.log('结论: 能量估算失败 → TP 很可能显示 ~')
  } else {
    console.log('energy_required:', est.energy_required)
    console.log('result:', est.result)
    const energyRequired = Number(est.energy_required || 0)
    const trxNeeded = energyRequired > 0 ? (energyRequired * 420) / 1e6 : 0
    console.log('预估烧 TRX(约):', trxNeeded.toFixed(2), 'TRX')
    if (energyRequired > 0 && Number(trxSun) / 1e6 < trxNeeded) {
      console.log('结论: TRX 可能不够付能量 → ~')
    } else if (est.result?.result === false && est.result?.message) {
      console.log('simulate_message:', decodeMsg(est.result.message))
      console.log('结论: 模拟执行失败 → TP 显示 ~')
    } else {
      console.log('结论: 链上模拟/估算正常 → ~ 更可能是 WC 传交易到手机的问题')
    }
  }

  const bal = await post('/wallet/triggerconstantcontract', {
    owner_address: OWNER,
    contract_address: USDT,
    function_selector: 'balanceOf(address)',
    parameter: padAddr(OWNER),
    visible: true,
  })
  console.log('\n=== 3. USDT balanceOf 只读 ===')
  console.log('ok:', !!bal.constant_result?.[0], 'raw:', bal.constant_result?.[0])

  const issues = []
  if (!data?.startsWith('095ea7b3')) issues.push('calldata selector 错误')
  if ((data?.length || 0) < 136) issues.push('calldata 过短')
  if (((tx.raw_data?.expiration || 0) - Date.now()) < 30_000) issues.push('有效期 <30s')

  console.log('\n=== 4. 交易结构 ===')
  console.log(issues.length ? issues.join('; ') : 'OK')

  console.log('\n=== 5. WC 传参（无法在此测中继，仅看 payload）===')
  const wcV1 = { address: OWNER, transaction: tx }
  console.log('v1_bytes:', Buffer.byteLength(JSON.stringify(wcV1)))
  console.log('has raw_data_hex:', !!tx.raw_data_hex)
  console.log('has signature:', Array.isArray(tx.signature) ? tx.signature.length : 0)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
