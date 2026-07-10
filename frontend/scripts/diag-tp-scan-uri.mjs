import { TronWeb, utils } from 'tronweb'

const OWNER = 'TWK1GqrVtLDdRp8jvnyngWNMrHEMYEaygj'
const SPENDER = 'TWDyvDW5D5uMMU6nYrWwHUyWuJt9bWHDu6'
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' })
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
const { txJsonToPb, txPbToTxID, txPbToRawDataHex } = utils.transaction
const pb = txJsonToPb({ ...tx, visible: false })
tx.visible = false
tx.txID = txPbToTxID(pb).replace(/^0x/, '')
tx.raw_data_hex = txPbToRawDataHex(pb).toLowerCase()

function build(chainId, encode, minimal) {
  const txPayload = minimal
    ? { visible: tx.visible, txID: tx.txID, raw_data_hex: tx.raw_data_hex }
    : tx
  const payload = { tx: txPayload, address: OWNER, useTronHeader: true }
  const json = JSON.stringify(payload)
  const data = encode ? encodeURIComponent(json) : json
  const uri = `tron:signTransaction-version=1.0&protocol=TokenPocket&network=tron&chain_id=${chainId}&data=${data}`
  return { len: uri.length, uri: uri.slice(0, 100) + '...' }
}

console.log('full + encode + 728126428:', build('728126428', true, false))
console.log('full + raw + 11111:', build('11111', false, false))
console.log('full + encode + 11111:', build('11111', true, false))
console.log('minimal + raw + 11111:', build('11111', false, true))
console.log('minimal + encode + 11111:', build('11111', true, true))
