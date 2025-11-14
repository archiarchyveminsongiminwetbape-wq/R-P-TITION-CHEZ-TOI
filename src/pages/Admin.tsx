import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

export default function Admin() {
  const { role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; role: 'parent' | 'teacher' | 'admin' }>>([])
  const [teachers, setTeachers] = useState<Array<{ user_id: string; bio: string | null; hourly_rate: number | null }>>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: profs }, { data: tprofs }] = await Promise.all([
        supabase.from('profiles').select('id,full_name,role').order('created_at', { ascending: false }),
        supabase.from('teacher_profiles').select('user_id,bio,hourly_rate'),
      ])
      setProfiles((profs as any) ?? [])
      setTeachers((tprofs as any) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const teachersSet = useMemo(() => new Set(teachers.map(t => t.user_id)), [teachers])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = profiles
      .filter(p => !q || (p.full_name || '').toLowerCase().includes(q) || p.id.startsWith(q))
      .map(p => ({
        ...p,
        isTeacher: p.role === 'teacher' || teachersSet.has(p.id),
      }))
    return list
  }, [profiles, teachersSet, search])

  const stats = useMemo(() => ({
    total: profiles.length,
    parents: profiles.filter(p => p.role === 'parent').length,
    teachers: profiles.filter(p => p.role === 'teacher').length,
    admins: profiles.filter(p => p.role === 'admin').length,
  }), [profiles])

  if (role !== 'admin') return null

  return (
    <section className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Administration</h2>
          <p className="text-slate-600">Vue d'ensemble des utilisateurs, parents et professeurs</p>
        </div>
        <input
          className="border rounded px-3 py-2"
          placeholder="Rechercher un utilisateur (nom, id)"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-3xl font-extrabold">{stats.total}</div>
          <div className="text-sm text-slate-600">Utilisateurs</div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-3xl font-extrabold">{stats.teachers}</div>
          <div className="text-sm text-slate-600">Professeurs</div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-3xl font-extrabold">{stats.parents}</div>
          <div className="text-sm text-slate-600">Parents</div>
        </div>
      </div>

      <div className="rounded-xl border overflow-auto">
        <div className="p-3 font-semibold border-b bg-white">Utilisateurs</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Professeur</th>
              <th className="p-3">Tarif (XAF)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-3" colSpan={5}>Chargement…</td></tr>
            )}
            {!loading && filtered.map((u) => {
              const t = teachers.find(x => x.user_id === u.id)
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{u.id}</td>
                  <td className="p-3">{u.full_name || '—'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.isTeacher ? 'Oui' : 'Non'}</td>
                  <td className="p-3">{t?.hourly_rate ?? '—'}</td>
                </tr>
              )
            })}
            {!loading && filtered.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
