/** 禁止浏览器缩放（Ctrl+滚轮、快捷键、双指捏合等） */
export function disableBrowserZoom() {
  const blockZoomWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault()
    }
  }

  const blockZoomKeys = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key
    if (key === '+' || key === '-' || key === '=' || key === '0' || key === '_') {
      event.preventDefault()
    }
  }

  const blockGesture = (event: Event) => {
    event.preventDefault()
  }

  document.addEventListener('wheel', blockZoomWheel, { passive: false })
  document.addEventListener('keydown', blockZoomKeys)
  document.addEventListener('gesturestart', blockGesture)
  document.addEventListener('gesturechange', blockGesture)
  document.addEventListener('gestureend', blockGesture)

  return () => {
    document.removeEventListener('wheel', blockZoomWheel)
    document.removeEventListener('keydown', blockZoomKeys)
    document.removeEventListener('gesturestart', blockGesture)
    document.removeEventListener('gesturechange', blockGesture)
    document.removeEventListener('gestureend', blockGesture)
  }
}
