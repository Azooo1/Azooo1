import { Buffer } from 'buffer'

/** TronWeb / 部分钱包 SDK 在浏览器中依赖 Node.js Buffer */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

if (typeof globalThis.global === 'undefined') {
  ;(globalThis as typeof globalThis & { global: typeof globalThis }).global = globalThis
}
