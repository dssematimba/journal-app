const pad = (n) => String(n).padStart(2, '0')

// Local calendar day, e.g. "2026-10-16" — used to group entries by day.
export const dayKey = (value) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const formatLongDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

export const formatShortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export const formatMonth = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export function relativeDay(value) {
  const key = dayKey(value)
  const today = new Date()
  if (key === dayKey(today)) return 'Today'
  today.setDate(today.getDate() - 1)
  if (key === dayKey(today)) return 'Yesterday'
  return formatShortDate(value)
}

// <input type="datetime-local"> works in local time without a timezone suffix.
export const toLocalInput = (value) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (value) => new Date(value).toISOString()

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
