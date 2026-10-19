import { useMemo, useState } from 'react'
import { OWNER_NAME } from '../../config.js'
import { useJournal, useNewEntry } from '../../state/JournalContext.jsx'
import { useTodos } from '../../state/TodosContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { navigate } from '../../lib/router.js'
import { dayKey, formatLongDate, greeting, relativeDay } from '../../lib/date.js'
import {
  averageMood, computeStreak, entriesThisMonth, entryExcerpt, entryHeading, moodFor,
} from '../../lib/journal.js'
import { SORTS, dueBucket, formatDue, parseQuickAdd, todayKey } from '../../lib/todos.js'
import { MoodPicker } from '../journal/fields.jsx'
import MoodTrend, { moodByDay } from '../journal/MoodTrend.jsx'
import { CheckIcon, FlameIcon, PlusIcon } from '../Icons.jsx'

function Widget({ title, action, className = '', children }) {
  return (
    <section className={`widget ${className}`}>
      <header className="widget-head">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="widget-body">{children}</div>
    </section>
  )
}

function CheckInWidget() {
  const { entries } = useJournal()
  const newEntry = useNewEntry()
  const { addEntry } = useJournal()
  const showToast = useToast()
  const loggedToday = entries.some((e) => e.mood && dayKey(e.date) === dayKey(new Date()))

  const checkIn = (mood) => {
    if (!mood) return
    const entry = addEntry({ mood })
    showToast(`${moodFor(mood).emoji} Mood logged`, {
      label: 'Add details',
      onClick: () => navigate(`/journal/${entry.id}`),
    })
  }

  return (
    <Widget
      title={loggedToday ? 'Check in again' : 'How are you feeling?'}
      action={<button className="link-btn" onClick={() => newEntry()}>Write an entry</button>}
    >
      <p className="widget-sub">One tap logs your mood. You can add details any time.</p>
      <MoodPicker value={null} onChange={checkIn} />
    </Widget>
  )
}

function GlanceWidget() {
  const { entries } = useJournal()
  const avg = averageMood(entries)
  const avgMood = avg && moodFor(Math.round(avg))
  const stats = [
    { value: <><FlameIcon size={18} className="stat-flame" />{computeStreak(entries)}</>, label: 'Day streak' },
    { value: entriesThisMonth(entries), label: 'Entries this month' },
    { value: avgMood ? <>{avgMood.emoji} {avgMood.label}</> : '—', label: 'Avg mood, 7 days' },
  ]
  return (
    <Widget title="At a glance">
      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </Widget>
  )
}

function RecentEntriesWidget() {
  const { entries } = useJournal()
  const newEntry = useNewEntry()
  return (
    <Widget
      title="Recent entries"
      className="span-2"
      action={<a className="link-btn" href="#/journal">View all</a>}
    >
      <div className="note-cards">
        <button className="note-card create" onClick={() => newEntry()}>
          <span className="create-icon"><PlusIcon size={22} /></span>
          <span>New entry</span>
        </button>
        {entries.slice(0, 7).map((e) => {
          const mood = e.mood && moodFor(e.mood)
          return (
            <a key={e.id} href={`#/journal/${e.id}`} className="note-card">
              <span className="note-card-title">{entryHeading(e)}</span>
              <span className="note-card-text">{entryExcerpt(e) || (mood ? 'Mood check-in' : '')}</span>
              <span className="note-card-foot">
                <span>{relativeDay(e.date)}</span>
                {mood && <span aria-label={mood.label}>{mood.emoji}</span>}
              </span>
            </a>
          )
        })}
      </div>
    </Widget>
  )
}

function TasksWidget() {
  const { todos, add, toggle } = useTodos()
  const [text, setText] = useState('')

  const today = todos
    .filter((t) => !t.done && ['overdue', 'today'].includes(dueBucket(t.due)))
    .sort(SORTS.due.compare)
  const upcoming = todos.filter((t) => !t.done && !today.includes(t)).sort(SORTS.due.compare)
  const shown = (today.length ? today : upcoming).slice(0, 6)
  const doneToday = todos.filter((t) => t.done && dayKey(t.completedAt) === todayKey()).length

  const submit = (e) => {
    e.preventDefault()
    const parsed = parseQuickAdd(text)
    if (!parsed.text) return
    add({ ...parsed, due: todayKey() })
    setText('')
  }

  return (
    <Widget title="Tasks" action={<a className="link-btn" href="#/todos">View all</a>}>
      <p className="widget-sub">
        {today.length ? `${today.length} for today` : shown.length ? 'Nothing due today — up next:' : 'You’re all clear.'}
        {doneToday > 0 && ` · ${doneToday} done today`}
      </p>
      <ul className="mini-tasks">
        {shown.map((t) => {
          const bucket = dueBucket(t.due)
          return (
            <li key={t.id} style={{ '--prio': `var(--prio-${t.priority})` }}>
              <button className="todo-check" role="checkbox" aria-checked="false" aria-label={`Complete: ${t.text}`} onClick={() => toggle(t)}>
                <CheckIcon size={12} strokeWidth="3" />
              </button>
              <a href={`#/todos?task=${t.id}`} className="mini-task-text">{t.text}</a>
              {t.due && <span className={`mini-due ${bucket}`}>{formatDue(t.due)}</span>}
            </li>
          )
        })}
      </ul>
      <form className="mini-add" onSubmit={submit}>
        <PlusIcon size={16} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task for today" aria-label="Add a task for today" />
      </form>
    </Widget>
  )
}

function MoodWidget() {
  const { entries } = useJournal()
  const logged = useMemo(() => moodByDay(entries).filter((d) => d.avg !== null).length, [entries])
  return (
    <Widget title="Mood · last 14 days" action={<span className="widget-meta">{logged} days logged</span>}>
      <MoodTrend entries={entries} />
    </Widget>
  )
}

function ScratchPadWidget() {
  const [text, setText] = useLocalStorage('home.scratch', '')
  return (
    <Widget title="Scratch pad" className="span-2" action={<span className="widget-meta">Saved automatically</span>}>
      <textarea
        className="scratch"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Jot something down — a thought, a reminder, a phone number…"
        aria-label="Scratch pad"
      />
    </Widget>
  )
}

export default function HomePage() {
  return (
    <div className="page-scroll">
      <div className="home">
        <header className="home-hero">
          <p className="eyebrow">{formatLongDate(new Date())}</p>
          <h1>{greeting()}, {OWNER_NAME}</h1>
        </header>
        <div className="widget-grid">
          <CheckInWidget />
          <GlanceWidget />
          <RecentEntriesWidget />
          <TasksWidget />
          <MoodWidget />
          <ScratchPadWidget />
        </div>
      </div>
    </div>
  )
}
