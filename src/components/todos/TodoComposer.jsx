import { useState } from 'react'
import { parseQuickAdd } from '../../lib/todos.js'
import { PlusIcon } from '../Icons.jsx'
import { DuePicker, PriorityPicker } from './pickers.jsx'

// Quick-add form with due-date and priority options.
export default function TodoComposer({ onAdd, inputRef, defaultDue = null }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState(defaultDue)
  const [priority, setPriority] = useState(0)

  const submit = (e) => {
    e.preventDefault()
    const parsed = parseQuickAdd(text)
    if (!parsed.text) return
    onAdd({ ...parsed, due, priority })
    setText('')
    setPriority(0)
    setDue(defaultDue)
  }

  // After picking an option, return focus to the text field so Enter still adds the task.
  const pick = (setter) => (value) => {
    setter(value)
    inputRef.current?.focus()
  }

  const inUse = text || priority || due !== defaultDue

  return (
    <form className={`todo-composer ${inUse ? 'in-use' : ''}`} onSubmit={submit}>
      <div className="composer-row">
        <span className="composer-plus" aria-hidden="true"><PlusIcon size={18} /></span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
        />
        <button type="submit" className="btn primary" disabled={!parseQuickAdd(text).text}>
          Add
        </button>
      </div>
      <div className="composer-options">
        <DuePicker value={due} onChange={pick(setDue)} />
        <span className="option-divider" aria-hidden="true" />
        <PriorityPicker value={priority} onChange={pick(setPriority)} />
      </div>
    </form>
  )
}
