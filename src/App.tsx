import './App.css'
import { useTranslation } from 'react-i18next'
import { Outlet, Link } from 'react-router-dom'

function App() {
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded" />
              <div className="leading-tight">
                <div className="font-bold tracking-tight">{t('title')}</div>
                <div className="text-xs text-slate-500">{t('subtitle')}</div>
              </div>
            </Link>
            <nav className="ml-auto hidden md:flex items-center gap-5 text-sm text-slate-700">
              <Link to="/" className="hover:text-black">Accueil</Link>
              <Link to="/search" className="hover:text-black">Recherche</Link>
              <Link to="/login" className="hover:text-black">Connexion</Link>
              <Link to="/register" className="hover:text-black">Inscription</Link>
            </nav>
            <select
              aria-label="language"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="ml-3 rounded border px-2 py-1 text-sm"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} {t('site.name')}</span>
          <a href="/search" className="underline hover:text-slate-700">{t('common.learn_more')}</a>
        </div>
      </footer>
    </div>
  )
}

export default App

