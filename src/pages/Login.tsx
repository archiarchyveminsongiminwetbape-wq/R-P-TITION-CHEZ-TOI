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
          const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).single()
          role = prof?.role as any
        } catch {}
      }
      toast({ variant: 'success', title: t('toast.login_ok') })
      if (role === 'teacher') navigate('/teacher')
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
    <section className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Connexion</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border p-2 rounded" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60" disabled={loading}>
          {loading ? '...' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-3 text-sm">
        Pas de compte ? <Link to="/register" className="underline">Créer un compte</Link>
      </p>
    </section>
  )
}
