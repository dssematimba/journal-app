import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/shell/Sidebar.jsx'
import SearchPalette from './components/shell/SearchPalette.jsx'
import ThemeSwitch from './components/shell/ThemeSwitch.jsx'
import HomePage from './components/home/HomePage.jsx'
import JournalPage from './components/journal/JournalPage.jsx'
import TodosPage from './components/todos/TodosPage.jsx'
import { MenuIcon, PlusIcon, SearchIcon } from './components/Icons.jsx'
import { JournalProvider, useJournal, useNewEntry } from './state/JournalContext.jsx'
import { TodosProvider } from './state/TodosContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { ThemeProvider } from './state/ThemeContext.jsx'
import { navigate, useRoute } from './lib/router.js'

const TITLES = { home: 'Home', journal: 'Journal', todos: 'Tasks' }

function Shell() {
  const route = useRoute()
  const [section, entryId] = route.parts
  const active = TITLES[section] ? section : 'home'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { addEntry, pruneEmpty } = useJournal()
  const newEntry = useNewEntry()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [route.hash])

  // Remove blank entries the user navigated away from.
  const currentEntry = active === 'journal' ? entryId ?? null : null
  useEffect(() => {
    pruneEmpty(currentEntry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEntry])

  // Old links: #/journal/new → create an entry; #/journal/:id/edit → #/journal/:id
  useEffect(() => {
    if (active !== 'journal') return
    if (entryId === 'new') navigate(`/journal/${addEntry().id}`, { replace: true })
    else if (route.parts[2] === 'edit') navigate(`/journal/${entryId}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.hash])

  // Global shortcuts: Ctrl/Cmd+K search, N new entry (Tasks page handles its own N).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
        return
      }
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey || active === 'todos') return
      if (e.target.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return
      e.preventDefault()
      newEntry()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const page = {
    home: <HomePage />,
    journal: <JournalPage id={entryId === 'new' ? null : entryId} tag={route.params.tag} />,
    todos: <TodosPage params={route.params} />,
  }[active]

  return (
    <div className={`shell ${drawerOpen ? 'drawer-open' : ''}`}>
      <Sidebar
        active={active}
        activeTag={active === 'journal' ? route.params.tag : null}
        onSearch={() => setSearchOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <span className="topbar-title">{TITLES[active]}</span>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
            <SearchIcon />
          </button>
          <ThemeSwitch compact />
          <button
            className="icon-btn accent"
            onClick={() => (active === 'todos' ? navigate('/todos?new=1') : newEntry())}
            aria-label={active === 'todos' ? 'New task' : 'New journal entry'}
          >
            <PlusIcon />
          </button>
        </header>
        <main className="main-body">{page}</main>
      </div>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <JournalProvider>
          <TodosProvider>
            <Shell />
          </TodosProvider>
        </JournalProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
