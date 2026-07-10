import { useEffect } from 'react'
import { ensureSalesmartlyScript, openSalesmartlyChat } from '../utils/salesmartly'

interface ChatWidgetProps {
  open?: boolean
  onClose?: () => void
}

/** SaleSmartly 插件自带悬浮入口；本组件仅负责按需打开聊天窗 */
export default function ChatWidget({ open, onClose }: ChatWidgetProps) {
  useEffect(() => {
    void ensureSalesmartlyScript()
  }, [])

  useEffect(() => {
    if (!open) return
    void openSalesmartlyChat().finally(() => onClose?.())
  }, [open, onClose])

  return null
}
