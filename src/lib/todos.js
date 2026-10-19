import { dayKey } from './date.js'

// Priority colors come from --prio-N tokens in index.css; a label/flag always accompanies them.
export const PRIORITIES = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
]

export const priorityFor = (value) => PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[0]

// Fill in fields missing from older saved tasks (the first version stored only id/text/done).
export const normalizeTodo = (t) => ({
  notes: '',
  due: null,
  priority: 0,
  tags: [],
  ...t,
  createdAt: t.createdAt ?? new Date(0).toISOString(),
  completedAt: t.done ? (t.completedAt ?? t.createdAt ?? new Date().toISOString()) : null,
})

/* ───────── Due dates (stored as local "YYYY-MM-DD") ───────── */

const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => dayKey(new Date())

export const daysFromToday = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export const BUCKETS = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'Next 7 days',
  later: 'Later',
  someday: 'No date',
}

export function dueBucket(due) {
  if (!due) return 'someday'
  const today = todayKey()
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  if (due === daysFromToday(1)) return 'tomorrow'
  if (due <= daysFromToday(7)) return 'week'
  return 'later'
}

export function formatDue(due) {
  const bucket = dueBucket(due)
  if (bucket === 'today') return 'Today'
  if (bucket === 'tomorrow') return 'Tomorrow'
  if (due === daysFromToday(-1)) return 'Yesterday'
  const d = parseDay(due)
  if (bucket === 'week') return d.toLocaleDateString(undefined, { weekday: 'long' })
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export const daysOverdue = (due) => Math.round((parseDay(todayKey()) - parseDay(due)) / 864e5)

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const completedToday = (t) => t.done && dayKey(t.completedAt) === todayKey()

/* ───────── Views, sorting, grouping ───────── */

export const VIEWS = {
  all: { label: 'All', test: (t) => !t.done, empty: 'No tasks yet. Add one above.' },
  today: {
    label: 'Today',
    test: (t) => !t.done && ['overdue', 'today'].includes(dueBucket(t.due)),
    empty: 'Nothing due today. Enjoy it.',
  },
  upcoming: {
    label: 'Upcoming',
    test: (t) => !t.done && ['tomorrow', 'week', 'later'].includes(dueBucket(t.due)),
    empty: 'Nothing scheduled ahead.',
  },
  someday: { label: 'No date', test: (t) => !t.done && !t.due, empty: 'Every task has a date.' },
  completed: { label: 'Completed', test: (t) => t.done, empty: 'Nothing completed yet.' },
}

const byPriority = (a, b) => b.priority - a.priority
const byDue = (a, b) => (a.due ?? '9999-99-99').localeCompare(b.due ?? '9999-99-99')
const byOldest = (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

export const SORTS = {
  due: { label: 'Due date', compare: (a, b) => byDue(a, b) || byPriority(a, b) || byOldest(a, b), grouped: true },
  priority: { label: 'Priority', compare: (a, b) => byPriority(a, b) || byDue(a, b) || byOldest(a, b) },
  newest: { label: 'Newest', compare: byNewest },
}

// [[bucketId, todos], …] in BUCKETS order, skipping empty buckets.
export function groupByDue(todos) {
  const groups = Object.fromEntries(Object.keys(BUCKETS).map((k) => [k, []]))
  todos.forEach((t) => groups[dueBucket(t.due)].push(t))
  return Object.entries(groups).filter(([, items]) => items.length)
}

// Pull "#tags" out of quick-add text: "Call mum #family" → { text: 'Call mum', tags: ['family'] }
export function parseQuickAdd(raw) {
  const tags = [...raw.matchAll(/(?:^|\s)#([\w-]+)/g)].map((m) => m[1].toLowerCase())
  const text = raw.replace(/(?:^|\s)#[\w-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return { text, tags: [...new Set(tags)] }
}
