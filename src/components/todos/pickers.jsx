import { PRIORITIES, daysFromToday, formatDue } from '../../lib/todos.js'
import { CalendarIcon, FlagIcon, XIcon } from '../Icons.jsx'

const QUICK_DUES = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'Next week', offset: 7 },
]

export function DuePicker({ value, onChange }) {
  const quick = QUICK_DUES.map((q) => ({ ...q, key: daysFromToday(q.offset) }))
  const isCustom = value && !quick.some((q) => q.key === value)

  return (
    <div className="option-group" role="group" aria-label="Due date">
      {quick.map((q) => (
        <button
          key={q.label}
          type="button"
          className={`option-chip ${value === q.key ? 'selected' : ''}`}
          aria-pressed={value === q.key}
          onClick={() => onChange(value === q.key ? null : q.key)}
        >
          {q.label}
        </button>
      ))}
      <label className={`option-chip date-chip ${isCustom ? 'selected' : ''}`}>
        <CalendarIcon size={14} />
        <span>{isCustom ? formatDue(value) : 'Pick date'}</span>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label="Pick a due date"
        />
      </label>
      {value && (
        <button type="button" className="icon-btn tiny" onClick={() => onChange(null)} aria-label="Clear due date">
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}

export function PriorityPicker({ value, onChange }) {
  return (
    <div className="option-group" role="radiogroup" aria-label="Priority">
      {PRIORITIES.slice(1).map((p) => (
        <button
          key={p.value}
          type="button"
          role="radio"
          aria-checked={value === p.value}
          className={`option-chip prio-chip ${value === p.value ? 'selected' : ''}`}
          style={{ '--prio': `var(--prio-${p.value})` }}
          onClick={() => onChange(value === p.value ? 0 : p.value)}
        >
          <FlagIcon size={14} />
          {p.label}
        </button>
      ))}
    </div>
  )
}
