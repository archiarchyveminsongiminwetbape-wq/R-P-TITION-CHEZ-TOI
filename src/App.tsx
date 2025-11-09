import './App.css'
import { useTranslation } from 'react-i18next'
import { Outlet, Link } from 'react-router-dom'

function App() {
  const { t, i18n } = useTranslation()

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo.png" alt="Logo" width={56} height={56} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              {t('title')}
            </Link>
          </h1>
          <p style={{ margin: 0, opacity: 0.8 }}>{t('subtitle')}</p>
        </div>
        <select
          aria-label="language"
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </header>

      <main style={{ marginTop: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
