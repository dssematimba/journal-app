import { useCallback, useEffect, useState } from 'react'

function read(key, initialValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? JSON.parse(stored) : initialValue
  } catch {
    return initialValue
  }
}

// State that persists to localStorage under `key`.
// Writes happen only on updates (never on mount), so opening the app can't clobber
// data saved by another tab, and changes made in other tabs are picked up live.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue))

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        if (Object.is(resolved, prev)) return prev // no-op updates never touch storage
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Storage unavailable (private mode, quota) — keep in-memory state.
        }
        return resolved
      })
    },
    [key],
  )

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setValue(read(key, initialValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // initialValue is only a fallback; re-subscribing when it changes identity isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, update]
}
