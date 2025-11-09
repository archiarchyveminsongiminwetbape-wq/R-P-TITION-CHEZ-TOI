import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'parent' | 'teacher'>('parent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    // après signup, le trigger (si ajouté) créera un profil parent; on met à jour le rôle si teacher
    const { data: sess } = await supabase.auth.getSession()
    const userId = sess.session?.user.id
    if (userId && role === 'teacher') {
      await supabase.from('profiles').update({ role: 'teacher', full_name: fullName }).eq('id', userId)
      await supabase.from('teacher_profiles').insert({ user_id: userId }).select().single()
    }
    // redirect by role
    setLoading(false)
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
        <button className="px-4 py-2 border rounded" disabled={loading}>
          {loading ? '...' : "S'inscrire"}
        </button>
      </form>
      <p className="mt-3 text-sm">
        Déjà un compte ? <Link to="/login" className="underline">Se connecter</Link>
      </p>
    </section>
  )
}
