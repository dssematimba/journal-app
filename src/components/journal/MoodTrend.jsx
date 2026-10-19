import { dayKey, formatShortDate } from '../../lib/date.js'
import { MOODS, moodFor } from '../../lib/journal.js'

const DAYS = 14

export function moodByDay(entries, days = DAYS) {
  const byDay = new Map()
  for (const e of entries) {
    if (!e.mood) continue
    const key = dayKey(e.date)
    byDay.set(key, [...(byDay.get(key) ?? []), e.mood])
  }
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const moods = byDay.get(dayKey(date)) ?? []
    const avg = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null
    return { date, avg, count: moods.length }
  })
}

// Dot plot of average mood per day over the last two weeks.
// Mood is encoded by height first; color and the tooltip's emoji + label repeat it.
export default function MoodTrend({ entries }) {
  const days = moodByDay(entries)
  const todayKey = dayKey(new Date())

  return (
    <div className="trend-plot">
      <div className="trend-axis" aria-hidden="true">
        {[...MOODS].reverse().map((m) => <span key={m.value} title={m.label}>{m.emoji}</span>)}
      </div>
      <div className="trend-days">
        {days.map(({ date, avg, count }) => {
          const rounded = avg && Math.round(avg)
          const mood = rounded && moodFor(rounded)
          const label = `${formatShortDate(date)}: ${mood ? `${mood.emoji} ${mood.label}${count > 1 ? ` (avg of ${count})` : ''}` : 'no mood logged'}`
          return (
            <div key={date.toISOString()} className="trend-day" tabIndex={0} aria-label={label}>
              <div className="trend-track">
                {mood ? (
                  <span
                    className="trend-dot"
                    style={{ bottom: `${((avg - 1) / 4) * 100}%`, background: `var(--mood-${rounded})` }}
                  />
                ) : (
                  <span className="trend-empty" />
                )}
                <span className="trend-tip" role="tooltip">{label}</span>
              </div>
              <span className={`trend-label ${dayKey(date) === todayKey ? 'today' : ''}`}>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
