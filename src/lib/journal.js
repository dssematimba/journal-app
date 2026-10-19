import { dayKey } from './date.js'

// Ordered rough → great. Colors come from --mood-N tokens in index.css.
export const MOODS = [
  { value: 1, label: 'Rough', emoji: '😣' },
  { value: 2, label: 'Low', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
]

export const moodFor = (value) => MOODS.find((m) => m.value === value)

export const ENERGY = ['Drained', 'Low', 'Steady', 'Good', 'Charged']

export const FEELINGS = [
  'Calm', 'Grateful', 'Happy', 'Excited', 'Hopeful', 'Motivated', 'Focused', 'Loved',
  'Tired', 'Bored', 'Anxious', 'Stressed', 'Overwhelmed', 'Frustrated', 'Sad', 'Lonely',
]

export const PROMPTS = [
  'What took up most of your headspace today?',
  'What made you smile today?',
  'What is one thing you learned recently?',
  'What would make tomorrow a good day?',
  'What is something you are looking forward to?',
  'What drained your energy, and what restored it?',
  'Describe a small moment you want to remember.',
  'What is one thing you would do differently today?',
  'Who are you thankful for right now, and why?',
  'What is weighing on you that you could let go of?',
]

export const emptyEntry = () => ({
  date: new Date().toISOString(),
  title: '',
  body: '',
  mood: null,
  energy: null,
  feelings: [],
  gratitude: ['', '', ''],
  tags: [],
})

// Fill in fields missing from older saved entries (the first version stored only `text`).
export const normalizeEntry = (e) => ({
  ...emptyEntry(),
  ...e,
  body: e.body ?? e.text ?? '',
  date: e.date ?? e.createdAt,
  gratitude: [...(e.gratitude ?? []), '', '', ''].slice(0, 3),
})

export const hasContent = (e) =>
  Boolean(e.mood || e.title.trim() || e.body.trim() || e.gratitude.some((g) => g.trim()))

export const entryHeading = (e) => {
  if (e.title.trim()) return e.title.trim()
  const firstLine = e.body.trim().split('\n')[0]
  if (firstLine) return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine
  return e.mood ? `Feeling ${moodFor(e.mood).label.toLowerCase()}` : 'Untitled'
}

// Consecutive days with at least one entry, ending today (or yesterday, until today ends).
export function computeStreak(entries) {
  const days = new Set(entries.map((e) => dayKey(e.date)))
  const d = new Date()
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export const entriesThisMonth = (entries) => {
  const month = dayKey(new Date()).slice(0, 7)
  return entries.filter((e) => dayKey(e.date).startsWith(month)).length
}

export function averageMood(entries, days = 7) {
  const since = Date.now() - days * 864e5
  const moods = entries.filter((e) => e.mood && new Date(e.date) >= since).map((e) => e.mood)
  return moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null
}

export const entryExcerpt = (e) =>
  (e.title.trim() ? e.body : e.body.trim().split('\n').slice(1).join(' ')).trim().replace(/\s+/g, ' ')

export const wordCount = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0)
