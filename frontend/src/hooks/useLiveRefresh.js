import { useEffect, useRef } from 'react'
import { subscribeDataChanged } from '../utils/liveSync'

/**
 * Keeps admin data fresh without a page reload.
 *
 * Calls `refresh()` (which should fetch silently):
 *   • every `interval` ms while the tab is visible (polling for changes from other devices)
 *   • immediately when another tab announces a change to one of `topics`
 *   • immediately when the tab becomes visible again after being hidden
 *
 * Only one interval exists per component, polling pauses in background tabs,
 * overlapping calls are skipped if `refresh` returns a pending promise, and
 * everything is cleaned up on unmount. The latest `refresh` is always used
 * (no stale closures), so callers do not need to memoise it.
 */
export function useLiveRefresh(refresh, { interval = 8000, topics = ['appointments'], enabled = true } = {}) {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const inFlight = useRef(false)
  const topicsKey = topics.join('|')

  useEffect(() => {
    if (!enabled) return undefined
    let timer = null

    const run = async () => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        await refreshRef.current?.()
      } catch {
        /* silent refresh — errors are surfaced by the next normal load */
      } finally {
        inFlight.current = false
      }
    }

    const start = () => {
      if (timer || document.visibilityState !== 'visible') return
      timer = setInterval(run, interval)
    }
    const stop = () => {
      clearInterval(timer)
      timer = null
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        run() // catch up straight away
        start()
      } else {
        stop()
      }
    }

    const wanted = new Set(topicsKey.split('|'))
    const unsubscribe = subscribeDataChanged((topic) => wanted.has(topic) && run())

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', run)
    return () => {
      stop()
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', run)
    }
  }, [interval, topicsKey, enabled])
}
