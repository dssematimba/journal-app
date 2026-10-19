import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { useTodos } from '../../state/TodosContext.jsx'
import { navigate } from '../../lib/router.js'
import { relativeDay } from '../../lib/date.js'
import {
  BUCKETS, PRIORITIES, SORTS, VIEWS, completedToday, dueBucket, groupByDue, todayKey,
} from '../../lib/todos.js'
import { CheckIcon, ChevronIcon, FlagIcon, SearchIcon, XIcon } from '../Icons.jsx'
import TodoComposer from './TodoComposer.jsx'
import TodoItem from './TodoItem.jsx'

const byCompletedDesc = (a, b) => new Date(b.completedAt) - new Date(a.completedAt)

function groupBy(items, keyFn) {
  const map = new Map()
  items.forEach((item) => {
    const key = keyFn(item)
    map.set(key, [...(map.get(key) ?? []), item])
  })
  return [...map.entries()]
}

export default function TodosPage({ params }) {
  const { todos, add, update, toggle, remove, clearCompleted } = useTodos()
  const [savedView, setView] = useLocalStorage('todos.view', 'all')
  const [savedSort, setSort] = useLocalStorage('todos.sort', 'due')
  const [showCompleted, setShowCompleted] = useLocalStorage('todos.showCompleted', true)
  const [query, setQuery] = useState('')
  const [prioFilter, setPrioFilter] = useState(null)
  const [tagFilter, setTagFilter] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const composerRef = useRef(null)
  const searchRef = useRef(null)

  const view = VIEWS[savedView] ? savedView : 'all'
  const sort = SORTS[savedSort] ? savedSort : 'due'

  // Deep links: ?new=1 focuses the composer, ?task=id opens that task.
  useEffect(() => {
    if (params.new) {
      if (view === 'completed') setView('all')
      setTimeout(() => composerRef.current?.focus(), 0)
      navigate('/todos', { replace: true })
    } else if (params.task) {
      const task = todos.find((t) => t.id === params.task)
      if (task) {
        setView(task.done ? 'completed' : 'all')
        setQuery('')
        setPrioFilter(null)
        setTagFilter(null)
        setExpandedId(task.id)
        setTimeout(() => document.getElementById(`task-${task.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50)
      }
      navigate('/todos', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.new, params.task])

  const onToggle = (todo) => {
    if (!todo.done && expandedId === todo.id) setExpandedId(null)
    toggle(todo)
  }

  /* ───── Keyboard: N = new task, / = search, Esc = collapse ───── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return setExpandedId(null)
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return
      if (e.key === 'n') {
        e.preventDefault()
        composerRef.current?.focus()
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ───── Derived data ───── */
  const allTags = useMemo(() => {
    const counts = {}
    todos.forEach((t) => t.tags.forEach((tag) => (counts[tag] = (counts[tag] ?? 0) + 1)))
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  }, [todos])

  const refine = (t) => {
    if (prioFilter !== null && t.priority !== prioFilter) return false
    if (tagFilter && !t.tags.includes(tagFilter)) return false
    const q = query.trim().toLowerCase()
    return !q || [t.text, t.notes, ...t.tags].join(' ').toLowerCase().includes(q)
  }
  const isRefining = query.trim() || prioFilter !== null || tagFilter

  const active = todos.filter((t) => !t.done)
  const overdueCount = active.filter((t) => dueBucket(t.due) === 'overdue').length
  const dueTodayCount = active.filter((t) => t.due === todayKey()).length
  const doneTodayCount = todos.filter(completedToday).length
  const todayTotal = doneTodayCount + overdueCount + dueTodayCount

  const counts = Object.fromEntries(Object.entries(VIEWS).map(([k, v]) => [k, todos.filter(v.test).length]))

  const isCompletedView = view === 'completed'
  const visible = todos.filter(VIEWS[view].test).filter(refine)
    .sort(isCompletedView ? byCompletedDesc : SORTS[sort].compare)

  // Completed section shown beneath the active list in All and Today.
  const completedBelow = view === 'all'
    ? todos.filter((t) => t.done).filter(refine).sort(byCompletedDesc)
    : view === 'today'
      ? todos.filter(completedToday).filter(refine).sort(byCompletedDesc)
      : []

  const groups = isCompletedView
    ? groupBy(visible, (t) => relativeDay(t.completedAt))
    : SORTS[sort].grouped
      ? groupByDue(visible).map(([bucket, items]) => [BUCKETS[bucket], items, bucket])
      : [[null, visible]]

  const itemProps = {
    onToggle,
    onUpdate: update,
    onDelete: remove,
    onExpand: setExpandedId,
    tagSuggestions: allTags,
  }

  const subtitle = active.length === 0
    ? (todos.length ? 'All clear — nice work.' : 'Nothing planned yet.')
    : `${active.length} ${active.length === 1 ? 'task' : 'tasks'} to go`

  return (
    <div className="page-scroll">
      <div className="page tasks-page">
        <header className="page-head">
          <div className="page-head-text">
            <h1>Tasks</h1>
            <p className="page-sub">{subtitle}</p>
            {todos.length > 0 && (
              <div className="todo-stats">
                {overdueCount > 0 && (
                  <button className="stat-pill danger" onClick={() => setView('today')}>{overdueCount} overdue</button>
                )}
                <button className="stat-pill" onClick={() => setView('today')}>{dueTodayCount} due today</button>
                <button className="stat-pill success" onClick={() => setView('completed')}>
                  <CheckIcon size={12} strokeWidth="3" /> {doneTodayCount} done today
                </button>
              </div>
            )}
          </div>
          {todayTotal > 0 && (
            <div className="today-ring" title={`${doneTodayCount} of ${todayTotal} of today's tasks done`}>
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" className="ring-track" />
                {doneTodayCount > 0 && (
                  <circle
                    cx="18" cy="18" r="15.5" className="ring-fill"
                    strokeDasharray={`${(doneTodayCount / todayTotal) * 97.4} 97.4`}
                  />
                )}
              </svg>
              <span className="ring-label">
                <strong>{doneTodayCount}/{todayTotal}</strong>
                <span>today</span>
              </span>
            </div>
          )}
        </header>

        {!isCompletedView && (
          <TodoComposer
            key={view}
            onAdd={add}
            inputRef={composerRef}
            defaultDue={view === 'today' ? todayKey() : null}
          />
        )}

        <nav className="view-tabs" aria-label="Task views">
          {Object.entries(VIEWS).map(([id, v]) => (
            <button
              key={id}
              className={`view-tab ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => { setView(id); setExpandedId(null) }}
            >
              {v.label}
              <span className={`count ${id === 'today' && overdueCount ? 'alert' : ''}`}>{counts[id]}</span>
            </button>
          ))}
        </nav>

        {todos.length > 0 && (
          <div className="refine-row">
            <label className="search">
              <SearchIcon size={15} />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter tasks"
                aria-label="Filter tasks"
              />
              <kbd className="search-kbd" aria-hidden="true">/</kbd>
            </label>
            <div className="filter-row">
              {PRIORITIES.slice(1).reverse().map((p) => (
                <button
                  key={p.value}
                  className={`filter-chip prio-filter ${prioFilter === p.value ? 'selected' : ''}`}
                  style={{ '--prio': `var(--prio-${p.value})` }}
                  aria-pressed={prioFilter === p.value}
                  onClick={() => setPrioFilter(prioFilter === p.value ? null : p.value)}
                >
                  <FlagIcon size={12} /> {p.label}
                </button>
              ))}
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  className={`filter-chip ${tagFilter === tag ? 'selected' : ''}`}
                  aria-pressed={tagFilter === tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  #{tag}
                </button>
              ))}
              {isRefining && (
                <button className="link-btn" onClick={() => { setQuery(''); setPrioFilter(null); setTagFilter(null) }}>
                  <XIcon size={13} /> Clear
                </button>
              )}
              {!isCompletedView && (
                <label className="sort-select">
                  <span>Sort</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="todo-empty">
            <div className="todo-empty-icon" aria-hidden="true">{isRefining ? <SearchIcon size={22} /> : <CheckIcon size={22} />}</div>
            <p>{isRefining ? 'No tasks match these filters.' : VIEWS[view].empty}</p>
          </div>
        ) : (
          groups.map(([title, items, bucket]) => (
            <section key={title ?? 'all'} className="todo-group">
              {title && groups.length > 1 && (
                <h2 className={`group-title ${bucket === 'overdue' ? 'danger-text' : ''}`}>
                  {title} <span className="group-count">{items.length}</span>
                </h2>
              )}
              <ul className={`todo-list ${isCompletedView ? 'completed-list' : ''}`}>
                {items.map((t) => <TodoItem key={t.id} todo={t} expanded={expandedId === t.id} {...itemProps} />)}
              </ul>
            </section>
          ))
        )}

        {completedBelow.length > 0 && (
          <section className="completed-section">
            <div className="completed-head">
              <button className="completed-toggle" onClick={() => setShowCompleted(!showCompleted)} aria-expanded={showCompleted}>
                <ChevronIcon size={16} className={`chevron ${showCompleted ? 'open' : ''}`} />
                {view === 'today' ? 'Completed today' : 'Completed'}
                <span className="count">{completedBelow.length}</span>
              </button>
              <button className="link-btn" onClick={() => clearCompleted(completedBelow)}>Clear</button>
            </div>
            {showCompleted && (
              <ul className="todo-list completed-list">
                {completedBelow.map((t) => <TodoItem key={t.id} todo={t} expanded={expandedId === t.id} {...itemProps} />)}
              </ul>
            )}
          </section>
        )}

        {isCompletedView && visible.length > 0 && (
          <div className="completed-footer">
            <button className="link-btn" onClick={() => clearCompleted(visible)}>Clear {visible.length} completed</button>
          </div>
        )}

        <p className="page-hint">
          Type <strong>#tag</strong> in a task to tag it · click a task for details
          <span className="kbd-hints"> · <kbd>N</kbd> new task · <kbd>/</kbd> filter</span>
        </p>
      </div>
    </div>
  )
}
