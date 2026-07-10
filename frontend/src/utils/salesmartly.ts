import { fetchCustomerServiceConfig } from '../api/client'

type SsqCommand = string

interface SsqQueue {
  push: (command: SsqCommand, ...args: unknown[]) => void
}

declare global {
  interface Window {
    ssq?: SsqQueue
  }
}

function getSsq(): SsqQueue {
  if (!window.ssq) {
    window.ssq = [] as unknown as SsqQueue
  }
  return window.ssq
}

let scriptLoading: Promise<void> | null = null
let loadedScriptUrl = ''

function scriptSelector(src: string) {
  return `script[data-salesmartly-src="${src}"]`
}

export async function ensureSalesmartlyScript(): Promise<boolean> {
  if (typeof document === 'undefined') return false

  const cfg = await fetchCustomerServiceConfig()
  if (!cfg?.enabled || !cfg.scriptUrl) return false

  const src = cfg.scriptUrl
  const existing = document.querySelector<HTMLScriptElement>(scriptSelector(src))
  if (existing?.dataset.loaded === 'true') return true

  if (scriptLoading && loadedScriptUrl === src) {
    await scriptLoading
    return true
  }

  document.querySelectorAll('script[data-salesmartly-src]').forEach((node) => {
    if (node.getAttribute('data-salesmartly-src') !== src) {
      node.remove()
    }
  })

  loadedScriptUrl = src
  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-salesmartly-src', src)
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('salesmartly-script-load-failed'))
    if (!existing) document.body.appendChild(script)
  })

  try {
    await scriptLoading
    return true
  } catch (err) {
    console.warn('SaleSmartly 插件加载失败:', err)
    return false
  } finally {
    scriptLoading = null
  }
}

export async function openSalesmartlyChat(): Promise<void> {
  const cfg = await fetchCustomerServiceConfig()
  if (!cfg?.enabled || !cfg.scriptUrl) return
  getSsq().push('chatOpen')
  await ensureSalesmartlyScript()
}

export async function isCustomerServiceEnabled(): Promise<boolean> {
  const cfg = await fetchCustomerServiceConfig()
  return Boolean(cfg?.enabled && cfg.scriptUrl)
}
