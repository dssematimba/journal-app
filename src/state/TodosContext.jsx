import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { normalizeTodo } from '../lib/todos.js'
import { useToast } from './ToastContext.jsx'

const TodosContext = createContext(null)

export function TodosProvider({ children }) {
  const [stored, setStored] = useLocalStorage('todos.items', [])
  const showToast = useToast()

  const value = useMemo(() => {
    const now = () => new Date().toISOString()
    const update = (id, patch) => setStored((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

    return {
      todos: stored.map(normalizeTodo),
      update,
      add: ({ text, tags = [], due = null, priority = 0 }) =>
        setStored((prev) => [
          ...prev,
          { id: crypto.randomUUID(), text, tags, due, priority, notes: '', done: false, createdAt: now(), completedAt: null },
        ]),
      toggle: (todo) => {
        const done = !todo.done
        update(todo.id, { done, completedAt: done ? now() : null })
        if (done) {
          showToast('Task completed', { label: 'Undo', onClick: () => update(todo.id, { done: false, completedAt: null }) })
        }
      },
      remove: (todo) => {
        const index = stored.findIndex((t) => t.id === todo.id)
        setStored((prev) => prev.filter((t) => t.id !== todo.id))
        showToast('Task deleted', {
          label: 'Undo',
          onClick: () => setStored((prev) => [...prev.slice(0, index), todo, ...prev.slice(index)]),
        })
      },
      clearCompleted: (items) => {
        const ids = new Set(items.map((t) => t.id))
        setStored((prev) => prev.filter((t) => !ids.has(t.id)))
        showToast(`Cleared ${items.length} completed`, { label: 'Undo', onClick: () => setStored(stored) })
      },
    }
  }, [stored, setStored, showToast])

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
}

export const useTodos = () => useContext(TodosContext)
