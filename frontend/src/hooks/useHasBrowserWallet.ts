import { useEffect, useState } from 'react'

/** 页面加载后检测是否安装了 EVM 浏览器钱包插件 */
export function useHasBrowserWallet() {
  const [hasBrowserWallet, setHasBrowserWallet] = useState<boolean | null>(null)

  useEffect(() => {
    const detect = () => {
      if (typeof window === 'undefined') return false
      return Boolean(window.ethereum)
    }
    setHasBrowserWallet(detect())
  }, [])

  return hasBrowserWallet
}
