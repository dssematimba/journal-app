import { useEffect, useState } from 'react'

// Hash routes:
//   #/home
//   #/journal            #/journal?tag=work
//   #/journal/:id        (entry open in the editor pane)
//   #/todos              #/todos?task=:id   #/todos?new=1
const readHash = () => window.location.hash.replace(/^#\/?/, '')

function parse(hash) {
  const [path, query = ''] = hash.split('?')
  return {
    hash,
    parts: path.split('/').filter(Boolean),
    params: Object.fromEntries(new URLSearchParams(query)),
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(readHash()))

  useEffect(() => {
    const onHashChange = () => setRoute(parse(readHash()))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export function navigate(path, { replace = false } = {}) {
  if (replace) {
    history.replaceState(null, '', `#${path}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = path
  }
}
