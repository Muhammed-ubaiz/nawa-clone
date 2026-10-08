/**
 * Lightweight cross-tab change notifications (no server push needed).
 *
 * After a successful write (e.g. a booking) call notifyDataChanged('appointments').
 * Every open admin tab in the same browser hears it instantly through
 * BroadcastChannel (or the `storage` event as a fallback) and refetches.
 * Changes made on other devices are picked up by polling (see useLiveRefresh).
 */
const CHANNEL = 'nawa-live-sync'
const STORAGE_KEY = 'nawa-live-sync'

let channel = null
const getChannel = () => {
  if (channel || typeof BroadcastChannel === 'undefined') return channel
  try {
    channel = new BroadcastChannel(CHANNEL)
  } catch {
    channel = null
  }
  return channel
}

/** Announce that data for `topic` changed (call after a successful API write). */
export function notifyDataChanged(topic) {
  const message = { topic, at: Date.now() }
  const ch = getChannel()
  if (ch) {
    ch.postMessage(message)
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
  } catch {
    /* storage unavailable — polling will still pick the change up */
  }
}

/** Listen for change notifications from other tabs. Returns an unsubscribe function. */
export function subscribeDataChanged(callback) {
  const ch = getChannel()
  const onMessage = (e) => e.data?.topic && callback(e.data.topic)
  const onStorage = (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      callback(JSON.parse(e.newValue).topic)
    } catch {
      /* ignore malformed values */
    }
  }
  ch?.addEventListener('message', onMessage)
  window.addEventListener('storage', onStorage)
  return () => {
    ch?.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}
