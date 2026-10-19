import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { hasContent, normalizeEntry } from '../lib/journal.js'
import { navigate } from '../lib/router.js'

const JournalContext = createContext(null)

export function JournalProvider({ children }) {
  const [stored, setStored] = useLocalStorage('journal.entries', [])

  const value = useMemo(() => {
    const entries = stored
      .map(normalizeEntry)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    const now = () => new Date().toISOString()

    return {
      entries,
      getEntry: (id) => entries.find((e) => e.id === id),
      addEntry: (data = {}) => {
        const entry = { ...normalizeEntry(data), id: crypto.randomUUID(), createdAt: now(), updatedAt: now() }
        setStored((prev) => [entry, ...prev])
        return entry
      },
      updateEntry: (id, data) =>
        setStored((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, updatedAt: now() } : e))),
      deleteEntry: (id) => setStored((prev) => prev.filter((e) => e.id !== id)),
      // Drop blank entries (e.g. "New entry" opened then abandoned), except the one being edited.
      // Checked against the latest stored value, so a just-flushed autosave is respected.
      pruneEmpty: (exceptId) =>
        setStored((prev) => {
          const kept = prev.filter((e) => e.id === exceptId || hasContent(normalizeEntry(e)))
          return kept.length === prev.length ? prev : kept
        }),
      restoreEntry: (entry) => setStored((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]),
    }
  }, [stored, setStored])

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
}

export const useJournal = () => useContext(JournalContext)

// Create an entry and open it in the editor.
export function useNewEntry() {
  const { addEntry } = useJournal()
  return (data) => {
    const entry = addEntry(data)
    navigate(`/journal/${entry.id}`)
    return entry
  }
}
