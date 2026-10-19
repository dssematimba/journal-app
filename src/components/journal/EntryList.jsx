import { useMemo, useState } from 'react'
import { useJournal, useNewEntry } from '../../state/JournalContext.jsx'
import { formatMonth, formatTime, relativeDay } from '../../lib/date.js'
import { MOODS, entryExcerpt, entryHeading, moodFor } from '../../lib/journal.js'
import { EditIcon, SearchIcon, TagIcon, XIcon } from '../Icons.jsx'

export default function EntryList({ selectedId, tag }) {
  const { entries } = useJournal()
  const newEntry = useNewEntry()
  const [query, setQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (tag && !e.tags.includes(tag)) return false
      if (moodFilter && e.mood !== moodFilter) return false
      if (!q) return true
      return [e.title, e.body, ...e.feelings, ...e.tags, ...e.gratitude].join(' ').toLowerCase().includes(q)
    })
  }, [entries, query, moodFilter, tag])

  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((e) => {
      const key = formatMonth(e.date)
      map.set(key, [...(map.get(key) ?? []), e])
    })
    return [...map.entries()]
  }, [filtered])

  const suffix = tag ? `?tag=${encodeURIComponent(tag)}` : ''

  return (
    <section className="list-pane" aria-label="Journal entries">
      <header className="list-head">
        <div className="list-title-row">
          <div>
            <h1 className="list-title">{tag ? `#${tag}` : 'Journal'}</h1>
            <span className="list-count">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <button className="btn primary sm" onClick={() => newEntry({ tags: tag ? [tag] : [] })} title="New entry (N)">
            <EditIcon size={15} /> New
          </button>
        </div>

        <label className="search">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journal"
            aria-label="Search journal"
          />
        </label>

        <div className="filter-row" aria-label="Filters">
          {tag && (
            <a href="#/journal" className="filter-chip selected" title="Clear tag filter">
              <TagIcon size={12} /> {tag} <XIcon size={12} />
            </a>
          )}
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={`filter-chip emoji ${moodFilter === m.value ? 'selected' : ''}`}
              onClick={() => setMoodFilter(moodFilter === m.value ? null : m.value)}
              aria-pressed={moodFilter === m.value}
              title={m.label}
            >
              {m.emoji}<span className="sr-only">{m.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="list-scroll">
        {filtered.length === 0 ? (
          <div className="list-empty">
            {entries.length === 0 ? (
              <>
                <p>No entries yet.</p>
                <button className="btn secondary sm" onClick={() => newEntry()}>Write your first entry</button>
              </>
            ) : (
              <p>No entries match.</p>
            )}
          </div>
        ) : (
          groups.map(([month, items]) => (
            <div key={month} className="list-group">
              <h2 className="list-group-title">{month}</h2>
              {items.map((e) => {
                const mood = e.mood && moodFor(e.mood)
                const excerpt = entryExcerpt(e)
                return (
                  <a
                    key={e.id}
                    href={`#/journal/${e.id}${suffix}`}
                    className={`entry-item ${selectedId === e.id ? 'selected' : ''}`}
                    aria-current={selectedId === e.id ? 'true' : undefined}
                  >
                    <span className="entry-item-top">
                      <span className="entry-item-title">{entryHeading(e)}</span>
                      {mood && <span className="entry-item-mood" title={mood.label}>{mood.emoji}</span>}
                    </span>
                    {excerpt && <span className="entry-item-text">{excerpt}</span>}
                    <span className="entry-item-meta">
                      <span>{relativeDay(e.date)} · {formatTime(e.date)}</span>
                      {e.tags.slice(0, 2).map((t) => <span key={t} className="entry-item-tag">#{t}</span>)}
                    </span>
                  </a>
                )
              })}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
