import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#141c2a] text-gray-200 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 space-y-3">
            <h1 className="text-lg font-semibold text-red-300">页面加载失败</h1>
            <p className="text-sm text-gray-400">
              请强制刷新（Ctrl+F5）。若仍白屏，请确认已上传完整 dist（index.html + hec-assets 全部文件）。
            </p>
            <pre className="text-xs text-red-200/80 whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
