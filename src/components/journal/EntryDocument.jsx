import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useJournal } from '../../state/JournalContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { navigate } from '../../lib/router.js'
import { formatLongDate, fromLocalInput, toLocalInput } from '../../lib/date.js'
import { FEELINGS, PROMPTS, hasContent, wordCount } from '../../lib/journal.js'
import { timeAgo } from '../../lib/todos.js'
import { ChipSelect, EnergyPicker, MoodPicker } from './fields.jsx'
import TagInput from '../TagInput.jsx'
import { ArrowLeftIcon, BookIcon, PlusIcon, SparkIcon, TrashIcon } from '../Icons.jsx'

const FORM_FIELDS = ['date', 'title', 'body', 'mood', 'energy', 'feelings', 'gratitude', 'tags']
const pickFields = (e) => Object.fromEntries(FORM_FIELDS.map((k) => [k, e[k]]))

function useAutosize(value) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

function Property({ label, children }) {
  return (
    <div className="prop">
      <span className="prop-label">{label}</span>
      <div className="prop-value">{children}</div>
    </div>
  )
}

function FeelingsField({ value, onChange }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <div>
        <ChipSelect options={FEELINGS} value={value} onChange={onChange} />
        <button type="button" className="link-btn prop-toggle" onClick={() => setOpen(false)}>Done</button>
      </div>
    )
  }
  return (
    <div className="chips">
      {value.map((f) => <span key={f} className="chip selected static">{f}</span>)}
      <button type="button" className="chip add" onClick={() => setOpen(true)}>
        <PlusIcon size={13} /> {value.length ? 'Edit' : 'Add feelings'}
      </button>
    </div>
  )
}

// The editor pane: every change autosaves (Evernote-style), no separate view/edit modes.
export default function EntryDocument({ entry, backHref }) {
  const { entries, updateEntry, deleteEntry, restoreEntry } = useJournal()
  const showToast = useToast()
  const [form, setForm] = useState(() => pickFields(entry))
  const [saving, setSaving] = useState(false)
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length))
  const lastSaved = useRef(JSON.stringify(pickFields(entry)))
  const pending = useRef(null)
  const bodyRef = useAutosize(form.body)
  const titleRef = useAutosize(form.title)

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  // Debounced autosave.
  useEffect(() => {
    const json = JSON.stringify(form)
    if (json === lastSaved.current) return
    setSaving(true)
    pending.current = form
    const t = setTimeout(() => {
      updateEntry(entry.id, form)
      lastSaved.current = json
      pending.current = null
      setSaving(false)
    }, 450)
    return () => clearTimeout(t)
  }, [form, entry.id, updateEntry])

  // Flush unsaved changes when leaving the entry.
  useEffect(() => () => {
    if (pending.current) updateEntry(entry.id, pending.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tagSuggestions = useMemo(() => {
    const counts = {}
    entries.forEach((e) => e.tags.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)))
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  }, [entries])

  const remove = () => {
    const snapshot = { ...entry, ...form }
    pending.current = null
    deleteEntry(entry.id)
    navigate(backHref.slice(1))
    if (hasContent(snapshot)) {
      showToast('Entry deleted', { label: 'Undo', onClick: () => restoreEntry(snapshot) })
    }
  }

  const isBlank = !hasContent(form)

  return (
    <div className="doc-pane">
      <div className="doc-toolbar">
        <a href={backHref} className="icon-btn back-btn" aria-label="Back to list"><ArrowLeftIcon /></a>
        <span className="doc-crumb"><BookIcon size={15} /> Journal</span>
        <span className="doc-status" aria-live="polite">
          {saving ? 'Saving…' : isBlank ? 'Start writing — it saves as you go' : 'Saved'}
        </span>
        <button className="icon-btn danger" onClick={remove} aria-label="Delete entry" title="Delete entry">
          <TrashIcon size={17} />
        </button>
      </div>

      <div className="doc-scroll">
        <article className="doc">
          <label className="doc-date">
            <span>{formatLongDate(form.date)}</span>
            <input
              type="datetime-local"
              value={toLocalInput(form.date)}
              onChange={(e) => e.target.value && set('date')(fromLocalInput(e.target.value))}
              aria-label="Entry date and time"
            />
          </label>

          <textarea
            ref={titleRef}
            className="doc-title"
            value={form.title}
            onChange={(e) => set('title')(e.target.value.replace(/\n/g, ''))}
            placeholder="Title"
            rows={1}
            autoFocus={isBlank}
            aria-label="Title"
          />

          <div className="props">
            <Property label="Mood"><MoodPicker value={form.mood} onChange={set('mood')} size="inline" /></Property>
            <Property label="Energy"><EnergyPicker value={form.energy} onChange={set('energy')} /></Property>
            <Property label="Feelings"><FeelingsField value={form.feelings} onChange={set('feelings')} /></Property>
            <Property label="Tags">
              <TagInput value={form.tags} onChange={set('tags')} suggestions={tagSuggestions} placeholder="Add tags" />
            </Property>
          </div>

          {!form.body && (
            <div className="doc-prompt">
              <SparkIcon size={15} />
              <span>{PROMPTS[promptIndex]}</span>
              <button type="button" className="link-btn" onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}>
                Another
              </button>
            </div>
          )}

          <textarea
            ref={bodyRef}
            className="doc-body"
            value={form.body}
            onChange={(e) => set('body')(e.target.value)}
            placeholder="Start writing…"
            aria-label="Entry text"
          />

          <section className="doc-gratitude">
            <h2>Grateful for</h2>
            <ol>
              {form.gratitude.map((g, i) => (
                <li key={i}>
                  <input
                    value={g}
                    onChange={(e) => set('gratitude')(form.gratitude.map((v, j) => (j === i ? e.target.value : v)))}
                    placeholder={['A person…', 'A moment…', 'A small thing…'][i]}
                    aria-label={`Gratitude ${i + 1}`}
                  />
                </li>
              ))}
            </ol>
          </section>

          <footer className="doc-footer">
            <span>{wordCount(form.body)} words</span>
            {entry.updatedAt && <span>Edited {timeAgo(entry.updatedAt)}</span>}
          </footer>
        </article>
      </div>
    </div>
  )
}
