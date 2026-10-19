import { useEffect, useRef, useState } from 'react'
import { daysOverdue, dueBucket, formatDue, priorityFor, timeAgo } from '../../lib/todos.js'
import { CalendarIcon, CheckIcon, FlagIcon, NoteIcon, TrashIcon } from '../Icons.jsx'
import TagInput from '../TagInput.jsx'
import { DuePicker, PriorityPicker } from './pickers.jsx'

function DueBadge({ due }) {
  const bucket = dueBucket(due)
  const overdue = bucket === 'overdue'
  return (
    <span className={`meta-item due ${bucket}`}>
      <CalendarIcon size={13} />
      {overdue ? `${formatDue(due)} · ${daysOverdue(due)}d overdue` : formatDue(due)}
    </span>
  )
}

function Meta({ todo }) {
  if (todo.done) {
    return (
      <div className="todo-meta">
        <span className="meta-item">Completed {timeAgo(todo.completedAt)}</span>
        {todo.tags.map((t) => <span key={t} className="meta-item tag-text">#{t}</span>)}
      </div>
    )
  }
  const hasMeta = todo.due || todo.priority || todo.notes.trim() || todo.tags.length
  if (!hasMeta) return null
  return (
    <div className="todo-meta">
      {todo.due && <DueBadge due={todo.due} />}
      {todo.priority > 0 && (
        <span className="meta-item prio" style={{ '--prio': `var(--prio-${todo.priority})` }}>
          <FlagIcon size={13} /> {priorityFor(todo.priority).label}
        </span>
      )}
      {todo.notes.trim() && <span className="meta-item" title="Has notes"><NoteIcon size={13} /><span className="sr-only">Has notes</span></span>}
      {todo.tags.map((t) => <span key={t} className="meta-item tag-text">#{t}</span>)}
    </div>
  )
}

export default function TodoItem({ todo, expanded, onExpand, onToggle, onUpdate, onDelete, tagSuggestions }) {
  const [completing, setCompleting] = useState(false)
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])

  // Let the check animation play before the task moves to the completed section.
  const toggle = () => {
    if (todo.done) return onToggle(todo)
    setCompleting(true)
    timer.current = setTimeout(() => onToggle(todo), 380)
  }

  const set = (key) => (value) => onUpdate(todo.id, { [key]: value })
  const checked = todo.done || completing

  return (
    <li
      id={`task-${todo.id}`}
      className={`todo-item ${todo.done ? 'done' : ''} ${completing ? 'completing' : ''} ${expanded ? 'expanded' : ''}`}
      style={{ '--prio': `var(--prio-${todo.priority})` }}
    >
      <div className="todo-row">
        <button
          className="todo-check"
          role="checkbox"
          aria-checked={checked}
          aria-label={`${checked ? 'Mark as not done' : 'Complete'}: ${todo.text}`}
          onClick={toggle}
        >
          <CheckIcon size={13} strokeWidth="3" />
        </button>

        <button className="todo-main" onClick={() => onExpand(expanded ? null : todo.id)} aria-expanded={expanded}>
          <span className="todo-text">{todo.text}</span>
          <Meta todo={todo} />
        </button>

        <button className="icon-btn subtle" onClick={() => onDelete(todo)} aria-label={`Delete ${todo.text}`}>
          <TrashIcon size={16} />
        </button>
      </div>

      {expanded && (
        <div className="todo-details">
          <input
            className="todo-edit-title"
            value={todo.text}
            onChange={(e) => set('text')(e.target.value)}
            onBlur={(e) => !e.target.value.trim() && set('text')('Untitled task')}
            aria-label="Task name"
          />
          <textarea
            className="todo-notes"
            value={todo.notes}
            onChange={(e) => set('notes')(e.target.value)}
            placeholder="Add notes…"
            rows={2}
            aria-label="Notes"
          />
          {!todo.done && (
            <>
              <div className="detail-row">
                <span className="detail-label">Due</span>
                <DuePicker value={todo.due} onChange={set('due')} />
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <PriorityPicker value={todo.priority} onChange={set('priority')} />
              </div>
            </>
          )}
          <div className="detail-row">
            <span className="detail-label">Tags</span>
            <div className="detail-grow">
              <TagInput value={todo.tags} onChange={set('tags')} suggestions={tagSuggestions} placeholder="Add a tag" />
            </div>
          </div>
          <div className="detail-footer">
            <span className="muted small">Added {timeAgo(todo.createdAt)}</span>
            <button className="btn ghost" onClick={() => onExpand(null)}>Done</button>
          </div>
        </div>
      )}
    </li>
  )
}
