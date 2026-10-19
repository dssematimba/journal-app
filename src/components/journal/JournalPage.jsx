import { useJournal, useNewEntry } from '../../state/JournalContext.jsx'
import EntryList from './EntryList.jsx'
import EntryDocument from './EntryDocument.jsx'
import { BookIcon } from '../Icons.jsx'

function EmptyDetail({ title, text }) {
  const newEntry = useNewEntry()
  return (
    <div className="detail-empty">
      <div className="detail-empty-icon"><BookIcon size={28} /></div>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="btn primary" onClick={() => newEntry()}>New entry</button>
      <p className="detail-empty-hint">or press <kbd>N</kbd></p>
    </div>
  )
}

// Two panes: entry list + editor. On phones only one pane shows at a time.
export default function JournalPage({ id, tag }) {
  const { getEntry } = useJournal()
  const entry = id ? getEntry(id) : null
  const backHref = `#/journal${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`

  return (
    <div className={`split ${id ? 'has-selection' : ''}`}>
      <EntryList selectedId={id} tag={tag} />
      <section className="detail-pane">
        {entry ? (
          <EntryDocument key={entry.id} entry={entry} backHref={backHref} />
        ) : id ? (
          <EmptyDetail title="Entry not found" text="It may have been deleted." />
        ) : (
          <EmptyDetail title="Select an entry" text="Pick an entry from the list to read or edit it." />
        )}
      </section>
    </div>
  )
}
