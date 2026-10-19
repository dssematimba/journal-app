import { useEffect, useMemo, useRef, useState } from 'react'
import { OWNER_NAME } from '../../config.js'
import { useJournal, useNewEntry } from '../../state/JournalContext.jsx'
import { useTodos } from '../../state/TodosContext.jsx'
import { navigate } from '../../lib/router.js'
import { BookIcon, CheckSquareIcon, HomeIcon, PlusIcon, SearchIcon, TagIcon, XIcon } from '../Icons.jsx'
import ThemeSwitch from './ThemeSwitch.jsx'

function NewMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const newEntry = useNewEntry()

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (action) => {
    setOpen(false)
    action()
  }

  return (
    <div className="new-menu" ref={ref}>
      <button className="new-btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <PlusIcon size={18} />
        <span className="sb-label">New</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <button role="menuitem" onClick={() => choose(() => newEntry())}>
            <BookIcon size={16} /> Journal entry <kbd>N</kbd>
          </button>
          <button role="menuitem" onClick={() => choose(() => navigate('/todos?new=1'))}>
            <CheckSquareIcon size={16} /> Task
          </button>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ active, activeTag, onSearch, onClose }) {
  const { entries } = useJournal()
  const { todos } = useTodos()

  const tags = useMemo(() => {
    const counts = {}
    entries.forEach((e) => e.tags.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [entries])

  const nav = [
    { id: 'home', label: 'Home', Icon: HomeIcon, href: '#/home' },
    { id: 'journal', label: 'Journal', Icon: BookIcon, href: '#/journal', count: entries.length },
    { id: 'todos', label: 'Tasks', Icon: CheckSquareIcon, href: '#/todos', count: todos.filter((t) => !t.done).length },
  ]

  return (
    <aside className="sidebar" aria-label="Main">
      <div className="sb-top">
        <div className="sb-account">
          <span className="avatar" aria-hidden="true">{OWNER_NAME[0]}</span>
          <span className="sb-label sb-name">{OWNER_NAME}&rsquo;s Journal</span>
          <button className="icon-btn sb-close" onClick={onClose} aria-label="Close menu"><XIcon /></button>
        </div>

        <button className="sb-search" onClick={onSearch} title="Search (Ctrl+K)">
          <SearchIcon size={16} />
          <span className="sb-label">Search</span>
          <kbd className="sb-label">Ctrl K</kbd>
        </button>

        <NewMenu />
      </div>

      <nav className="sb-nav">
        {nav.map(({ id, label, Icon, href, count }) => (
          <a
            key={id}
            href={href}
            className={`sb-item ${active === id && !activeTag ? 'active' : ''}`}
            aria-current={active === id && !activeTag ? 'page' : undefined}
            title={label}
          >
            <Icon size={18} />
            <span className="sb-label">{label}</span>
            {count > 0 && <span className="sb-count sb-label">{count}</span>}
          </a>
        ))}
      </nav>

      {tags.length > 0 && (
        <div className="sb-section">
          <div className="sb-heading sb-label">Tags</div>
          {tags.map(([tag, count]) => (
            <a
              key={tag}
              href={`#/journal?tag=${encodeURIComponent(tag)}`}
              className={`sb-item sb-tag ${activeTag === tag ? 'active' : ''}`}
              title={`#${tag}`}
            >
              <TagIcon size={16} />
              <span className="sb-label">{tag}</span>
              <span className="sb-count sb-label">{count}</span>
            </a>
          ))}
        </div>
      )}

      <div className="sb-footer">
        <ThemeSwitch />
      </div>
    </aside>
  )
}
