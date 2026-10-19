# Diana's Journal

A journal and task app with an Evernote-inspired design, built with React and Vite. Everything is stored locally in the browser (localStorage) — no account or server.

## Run

```
npm install
npm run dev
```

## Layout

- **Sidebar** — search, a green **New** button (journal entry or task), Home / Journal / Tasks, your tags, and a light/dark theme switch.
- **Home** — greeting banner and widgets: mood check-in, at-a-glance stats, recent entries, today's tasks with quick add, a 14-day mood trend, and a scratch pad.
- **Journal** — entry list beside an editor. Entries save automatically as you type; there are no separate view/edit modes.
- **Tasks** — quick add with due date and priority, views (All, Today, Upcoming, No date, Completed), filters, sorting, and inline details.

Responsive: full sidebar on desktop, an icon rail on tablets (768–1023px), and on phones a top bar with a slide-out drawer, showing either the entry list or the open entry.

## Features

**Journal**
- One-tap mood check-ins (Home), plus full entries: date/time, title, mood, energy, feelings, writing prompt, free text, three gratitude items, tags
- Autosave; blank entries you leave are discarded automatically
- Search and filter by mood, or by tag from the sidebar
- Delete with undo

**Tasks**
- Due date, priority, notes and tags (type `#tag` while adding)
- Views with counts, filters by priority/tag/text, sort by due date (grouped), priority or newest
- Completed tasks are struck through and faded, in their own collapsible section
- Header with overdue / due today / done today and a ring tracking today's progress
- Complete, delete and clear-completed all have undo

**Shortcuts** — `Ctrl/Cmd + K` search everything · `N` new entry (or new task on the Tasks page) · `/` filter tasks · `Esc` close

## Structure

```
src/
  App.jsx                         Shell (sidebar, top bar, routes, global shortcuts)
  config.js                       Owner name shown in sidebar and greeting
  index.css                       Design tokens (light/dark), type & spacing scale, all styles
  lib/
    router.js                     Hash routes with query params
    journal.js                    Moods, feelings, prompts, stats, entry helpers + migration
    todos.js                      Priorities, due-date buckets, views, sorts, migration
    date.js                       Date formatting helpers
  state/
    ThemeContext.jsx              Light/dark theme (defaults to the OS setting)
    JournalContext.jsx            Entries, backed by localStorage
    TodosContext.jsx              Tasks, backed by localStorage
    ToastContext.jsx              Toasts with optional Undo
  hooks/useLocalStorage.js        Persisted, cross-tab-synced state
  components/
    shell/                        Sidebar, ThemeSwitch, SearchPalette
    home/HomePage.jsx             Dashboard widgets
    journal/                      JournalPage, EntryList, EntryDocument (editor), MoodTrend, fields
    todos/                        TodosPage, TodoComposer, TodoItem, pickers
    TagInput.jsx, Icons.jsx       Shared
```
