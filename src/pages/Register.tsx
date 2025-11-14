import { useState } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'

export default function Register() {
  const [search] = useSearchParams()
  const initialRole = (search.get('role') === 'teacher' ? 'teacher' : 'parent') as 'parent' | 'teacher'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'parent' | 'teacher'>(initialRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (!hasSupabaseConfig) {
      const msg = 'Configuration Supabase manquante. Contactez l’administrateur.'
      setLoading(false)
      setError(msg)
      toast({ variant: 'error', title: t('toast.error'), description: msg })
      return
    }

    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) {
      setLoading(false)
      setError(error.message)
      toast({ variant: 'error', title: t('toast.error'), description: error.message })
      return
    }
    // après signup, le trigger (si ajouté) créera un profil parent; on met à jour le rôle si teacher si session présente
    const { data: sess } = await supabase!.auth.getSession()
    const userId = sess.session?.user.id
    if (userId && role === 'teacher') {
      await supabase!.from('profiles').update({ role: 'teacher', full_name: fullName }).eq('id', userId)
      await supabase!.from('teacher_profiles').insert({ user_id: userId }).select().single()
    }
    // redirect by role
    setLoading(false)
    toast({ variant: 'success', title: t('toast.register_ok') })
    // Si pas de session (email confirmation), on dirige vers la page de connexion
    if (!userId) {
      navigate('/login')
      return
    }
    if (role === 'teacher') navigate('/teacher')
    else navigate('/parent')
  }

  return (
    <section className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Créer un compte</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input className="w-full border p-2 rounded" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border p-2 rounded" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="w-full border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value as 'parent' | 'teacher')}>
          <option value="parent">Parent</option>
          <option value="teacher">Professeur</option>
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60" disabled={loading}>
          {loading ? '...' : "S'inscrire"}
        </button>
      </form>
      <p className="mt-3 text-sm">
        Déjà un compte ? <Link to="/login" className="underline">Se connecter</Link>
      </p>
    </section>
  )
}
