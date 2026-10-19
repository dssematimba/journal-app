import { ENERGY, MOODS } from '../../lib/journal.js'

export function MoodPicker({ value, onChange, size = 'lg' }) {
  return (
    <div className={`mood-picker ${size}`} role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={value === m.value}
          className={`mood-option ${value === m.value ? 'selected' : ''}`}
          style={{ '--mood': `var(--mood-${m.value})` }}
          onClick={() => onChange(value === m.value ? null : m.value)}
        >
          <span className="mood-emoji">{m.emoji}</span>
          <span className="mood-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export function EnergyPicker({ value, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Energy">
      {ENERGY.map((label, i) => {
        const level = i + 1
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={value === level}
            className={value === level ? 'selected' : ''}
            onClick={() => onChange(value === level ? null : level)}
          >
            <span className="energy-bars" aria-hidden="true">
              {ENERGY.map((_, j) => <i key={j} className={j < level ? 'on' : ''} />)}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function ChipSelect({ options, value, onChange }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  return (
    <div className="chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`chip ${value.includes(opt) ? 'selected' : ''}`}
          aria-pressed={value.includes(opt)}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
