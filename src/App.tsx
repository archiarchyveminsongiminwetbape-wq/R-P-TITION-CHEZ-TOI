import './App.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, Link } from 'react-router-dom'

function App() {
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

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
            <button
              type="button"
              aria-label="Toggle menu"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-auto md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <nav className="hidden md:flex items-center gap-4 text-sm text-slate-700 ml-auto">
              <Link to="/" className="px-2 py-1 rounded hover:text-black hover:bg-slate-50 transition">Accueil</Link>
              <Link to="/search" className="px-2 py-1 rounded hover:text-black hover:bg-slate-50 transition">Recherche</Link>
              <Link to="/login" className="px-3 py-1.5 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition">Connexion</Link>
              <Link to="/register?role=teacher" className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">Inscription</Link>
            </nav>
            <div className="hidden md:block">
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
        </div>
        {mobileOpen && (
          <div id="mobile-menu" className="md:hidden border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex flex-col gap-3 text-sm text-slate-700">
                <Link to="/" onClick={() => setMobileOpen(false)} className="hover:text-black">Accueil</Link>
                <Link to="/search" onClick={() => setMobileOpen(false)} className="hover:text-black">Recherche</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="hover:text-black">Connexion</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="hover:text-black">Inscription</Link>
                <div className="pt-2">
                  <select
                    aria-label="language"
                    value={i18n.language}
                    onChange={(e) => { i18n.changeLanguage(e.target.value); setMobileOpen(false) }}
                    className="w-full rounded border px-2 py-2 text-sm"
                  >
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
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

