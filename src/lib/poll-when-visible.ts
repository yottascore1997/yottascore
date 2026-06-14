/** Run callback on an interval only while the browser tab is visible. */
export function pollWhenVisible(callback: () => void, intervalMs: number): () => void {
  const tick = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }
    callback()
  }

  tick()
  const interval = setInterval(tick, intervalMs)

  return () => clearInterval(interval)
}
