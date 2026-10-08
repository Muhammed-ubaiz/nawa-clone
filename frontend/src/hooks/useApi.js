import { useCallback, useEffect, useRef, useState } from 'react'

const same = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

/**
 * Runs an async request and tracks { data, loading, error }.
 * `fetcher` receives an AbortSignal; it re-runs whenever `deps` change.
 *
 *   reload()  — normal refetch (shows loading state)
 *   refresh() — silent background refetch for live updates: no loading flag,
 *               keeps current data on failure, and only updates state when the
 *               data actually changed (so charts don't re-animate needlessly).
 *               Returns a promise; skipped while a normal load is in flight.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const dataRef = useRef(null)
  const loadingRef = useRef(true)
  const controllerRef = useRef(null)

  const run = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    loadingRef.current = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        dataRef.current = data
        loadingRef.current = false
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'CanceledError') return
        loadingRef.current = false
        setState({ data: null, loading: false, error })
      })
    return controller
  }, [])

  const refresh = useCallback(async () => {
    if (loadingRef.current) return // a normal load is already fetching fresh data
    const signal = controllerRef.current?.signal
    try {
      const data = await fetcherRef.current(signal)
      if (signal?.aborted || loadingRef.current) return
      if (!same(data, dataRef.current)) {
        dataRef.current = data
        setState({ data, loading: false, error: null })
      }
    } catch {
      /* keep showing the last good data; the next poll will retry */
    }
  }, [])

  useEffect(() => {
    const controller = run()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, reload: run, refresh }
}
