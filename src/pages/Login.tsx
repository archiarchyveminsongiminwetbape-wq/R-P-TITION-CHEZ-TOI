import { useState } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!hasSupabaseConfig) throw new Error('Configuration Supabase manquante.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message?.toLowerCase().includes('email not confirmed')
          ? 'Email non confirmé. Vérifiez votre boîte mail.'
          : error.message
        throw new Error(msg)
      }
      // get role and redirect
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess.session?.user.id
      let role: 'parent' | 'teacher' | 'admin' | undefined
      if (uid) {
        try {
          // Ensure profile exists (fallback if DB trigger failed)
          const { data: prof, error: profErr } = await supabase.from('profiles').select('role').eq('id', uid).single()
          if (profErr && profErr.code === 'PGRST116') {
            await supabase.from('profiles').insert({ id: uid, role: 'parent' })
            role = 'parent'
          } else {
            role = (prof?.role as any) || 'parent'
          }

          // If auth metadata indicates role (teacher/admin) but profile isn't yet, upgrade profile role
          const metaRole = (sess.session?.user.user_metadata as any)?.role
          if ((metaRole === 'teacher' || metaRole === 'admin') && role !== metaRole) {
            await supabase.from('profiles').update({ role: metaRole }).eq('id', uid)
            role = metaRole
          }

          // Auto-promote admin email (configurable via env)
          const ADMIN_EMAIL = ((import.meta as any).env?.VITE_ADMIN_EMAIL as string | undefined)?.toLowerCase() || 'pminsongui@gmail.com'
          const loggedEmail = sess.session?.user.email?.toLowerCase()
          if (loggedEmail === ADMIN_EMAIL && role !== 'admin') {
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', uid)
            role = 'admin'
          }

          // If teacher, ensure teacher_profiles row exists
          if (role === 'teacher') {
            const { error: tErr } = await supabase
              .from('teacher_profiles')
              .select('user_id')
              .eq('user_id', uid)
              .single()
            if (tErr && tErr.code === 'PGRST116') {
              await supabase.from('teacher_profiles').insert({ user_id: uid })
            }
          }
        } catch {}
      }
      toast({ variant: 'success', title: t('toast.login_ok') })
      if (role === 'admin') navigate('/admin')
      else if (role === 'teacher') navigate('/teacher')
      else if (role === 'parent') navigate('/parent')
      else navigate('/')
    } catch (err: any) {
      const msg = err?.message || 'Erreur de connexion'
      setError(msg)
      toast({ variant: 'error', title: t('toast.error'), description: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Connexion</h2>
      <div className="rounded-lg border p-5 shadow-sm bg-white">
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="w-full px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60" disabled={loading}>
            {loading ? '...' : 'Se connecter'}
          </button>
        </form>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          className="underline"
          onClick={async () => {
            try {
              if (!email) throw new Error('Saisissez votre email')
              if (!hasSupabaseConfig) throw new Error('Configuration Supabase manquante.')
              await supabase.auth.resend({ type: 'signup', email })
              toast({ variant: 'success', title: 'Email de confirmation renvoyé' })
            } catch (e: any) {
              toast({ variant: 'error', title: t('toast.error'), description: e?.message || 'Erreur' })
            }
          }}
        >Renvoyer l'email de confirmation</button>
        <span className="opacity-50">|</span>
        <button
          className="underline"
          onClick={async () => {
            try {
              if (!email) throw new Error('Saisissez votre email')
              if (!hasSupabaseConfig) throw new Error('Configuration Supabase manquante.')
              const redirectTo = `${window.location.origin}/reset-password`
              await supabase.auth.resetPasswordForEmail(email, { redirectTo })
              toast({ variant: 'success', title: 'Email de réinitialisation envoyé' })
            } catch (e: any) {
              toast({ variant: 'error', title: t('toast.error'), description: e?.message || 'Erreur' })
            }
          }}
        >Mot de passe oublié</button>
      </div>
      <p className="mt-3 text-sm">
        Pas de compte ? <Link to="/register" className="underline">Créer un compte</Link>
      </p>
    </section>
  )
}
