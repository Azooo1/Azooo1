import { useAuth } from '../auth/AuthProvider'
import { useWalletServerBind } from '../hooks/useWalletServerBind'

/** 全局监听 wagmi 连接状态，将钱包地址绑定到当前用户 */
export default function WalletServerBind() {
  const { token, isAuthenticated, updateUser } = useAuth()
  useWalletServerBind(isAuthenticated ? token : null, updateUser)
  return null
}
