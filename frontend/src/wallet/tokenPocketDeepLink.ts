/** 在手机系统浏览器中唤起 TokenPocket 内置 DApp 浏览器打开指定 URL */
export function buildTokenPocketDappOpenUrl(pageUrl: string): string {
  const params = encodeURIComponent(
    JSON.stringify({
      url: pageUrl,
      chain: 'TRX',
      source: 'hec-mining',
    }),
  )
  return `tpdapp://open?params=${params}`
}

/** 当前浏览器访问的前端 origin（二维码等必须用实时地址，不能写死 env 域名） */
export function resolveLiveFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  const fromEnv = import.meta.env.VITE_WC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://hecminai.cloud'
}

export function resolveDappPageUrl(): string {
  return resolveLiveFrontendOrigin()
}

/** 扫码授权：展示当前站点 URL 二维码，供手机钱包扫一扫打开 */
export function resolveWalletApprovePageUrl(): string {
  const base = resolveLiveFrontendOrigin()
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const path = basePath && basePath !== '/' ? `${basePath}/dashboard` : '/dashboard'
  return `${base}${path}`
}
