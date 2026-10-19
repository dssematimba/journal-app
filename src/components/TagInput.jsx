import { useState } from 'react'
import { XIcon } from './Icons.jsx'

export default function TagInput({ value, onChange, suggestions = [], placeholder = 'work, family, health…' }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 6)

  return (
    <div>
      <div className="tag-input">
        {value.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <XIcon size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? '' : placeholder}
          aria-label="Add tag"
        />
      </div>
      {unused.length > 0 && (
        <div className="tag-suggestions">
          {unused.map((s) => (
            <button key={s} type="button" className="link-btn" onClick={() => add(s)}>#{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}
