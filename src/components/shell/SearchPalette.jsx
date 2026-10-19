import { useEffect, useMemo, useRef, useState } from 'react'
import { useJournal } from '../../state/JournalContext.jsx'
import { useTodos } from '../../state/TodosContext.jsx'
import { navigate } from '../../lib/router.js'
import { relativeDay } from '../../lib/date.js'
import { entryHeading, moodFor } from '../../lib/journal.js'
import { formatDue } from '../../lib/todos.js'
import { BookIcon, CheckIcon, CheckSquareIcon, SearchIcon } from '../Icons.jsx'

// Ctrl/Cmd+K: search journal entries and tasks together.
export default function SearchPalette({ onClose }) {
  const { entries } = useJournal()
  const { todos } = useTodos()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (parts) => !q || parts.join(' ').toLowerCase().includes(q)
    const limit = q ? 8 : 4

    const entryResults = entries
      .filter((e) => matches([e.title, e.body, ...e.tags, ...e.feelings, ...e.gratitude]))
      .slice(0, limit)
      .map((e) => ({
        key: `e-${e.id}`,
        group: 'Journal',
        title: entryHeading(e),
        sub: [relativeDay(e.date), ...e.tags.map((t) => `#${t}`)].join(' · '),
        lead: e.mood ? moodFor(e.mood).emoji : <BookIcon size={16} />,
        go: `/journal/${e.id}`,
      }))

    const taskResults = todos
      .filter((t) => matches([t.text, t.notes, ...t.tags]))
      .sort((a, b) => a.done - b.done)
      .slice(0, limit)
      .map((t) => ({
        key: `t-${t.id}`,
        group: 'Tasks',
        title: t.text,
        sub: t.done ? 'Completed' : t.due ? `Due ${formatDue(t.due)}` : 'No due date',
        lead: t.done ? <CheckIcon size={16} /> : <CheckSquareIcon size={16} />,
        done: t.done,
        go: `/todos?task=${t.id}`,
      }))

    return [...entryResults, ...taskResults]
  }, [query, entries, todos])

  useEffect(() => setIndex(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const open = (result) => {
    onClose()
    navigate(result.go)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[index]) {
      open(results[index])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="palette-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <label className="palette-input">
          <SearchIcon size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search entries and tasks…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
          />
          <kbd>Esc</kbd>
        </label>

        <ul className="palette-results" id="palette-results" role="listbox" ref={listRef}>
          {results.length === 0 && <li className="palette-empty">No matches for “{query}”</li>}
          {results.map((r, i) => (
            <li key={r.key} role="presentation">
              {(i === 0 || results[i - 1].group !== r.group) && (
                <div className="palette-group">{query.trim() ? r.group : `Recent ${r.group.toLowerCase()}`}</div>
              )}
              <button
                role="option"
                aria-selected={i === index}
                className={`palette-item ${r.done ? 'done' : ''}`}
                onMouseMove={() => setIndex(i)}
                onClick={() => open(r)}
              >
                <span className="palette-lead">{r.lead}</span>
                <span className="palette-text">
                  <span className="palette-title">{r.title}</span>
                  <span className="palette-sub">{r.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
        </div>
      </div>
    </div>
  )
}
