import { useTheme } from '../../state/ThemeContext.jsx'
import { MoonIcon, SunIcon } from '../Icons.jsx'

// compact = icon-only button (top bar); otherwise a labelled switch (sidebar).
export default function ThemeSwitch({ compact = false }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  if (compact) {
    return (
      <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
    )
  }

  return (
    <button className="theme-switch" role="switch" aria-checked={dark} onClick={toggle} title="Toggle dark theme">
      {dark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
      <span className="sb-label">Dark theme</span>
      <span className="switch-track sb-label" aria-hidden="true"><span className="switch-thumb" /></span>
    </button>
  )
}
