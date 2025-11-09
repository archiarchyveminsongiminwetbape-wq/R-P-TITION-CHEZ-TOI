import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type Teacher = { user_id: string; bio: string | null; hourly_rate: number | null; levels: string[] | null }

export default function TeacherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectsList, setSubjectsList] = useState<Array<{id:number;name:string}>>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [neighborhoodsList, setNeighborhoodsList] = useState<Array<{id:number;name:string}>>([])
  const [loading, setLoading] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [neighborhoodId, setNeighborhoodId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)

      const [{ data: p }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('id,full_name,avatar_url').eq('id', id).single(),
        supabase.from('teacher_profiles').select('user_id,bio,hourly_rate,levels').eq('user_id', id).single(),
      ])
      setProfile((p as any) ?? null)
      setTeacher((t as any) ?? null)

      const [{ data: subjLinks }, { data: neiLinks }, { data: allSubj }, { data: allNei }] = await Promise.all([
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', id),
        supabase.from('teacher_neighborhoods').select('neighborhood_id').eq('teacher_id', id),
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('neighborhoods').select('id,name').order('name'),
      ])

      const subjIds = (subjLinks ?? []).map((x: any) => x.subject_id)
      const neiIds = (neiLinks ?? []).map((x: any) => x.neighborhood_id)

      const [{ data: subjs }, { data: neis }] = await Promise.all([
        subjIds.length ? supabase.from('subjects').select('name').in('id', subjIds) : Promise.resolve({ data: [] as any }),
        neiIds.length ? supabase.from('neighborhoods').select('name').in('id', neiIds) : Promise.resolve({ data: [] as any }),
      ])
      setSubjects((subjs ?? []).map((s: any) => s.name))
      setNeighborhoods((neis ?? []).map((n: any) => n.name))
      setSubjectsList((allSubj ?? []) as any)
      setNeighborhoodsList((allNei ?? []) as any)

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <section className="p-6">Chargement…</section>
  if (!profile || !teacher) return <section className="p-6">Professeur introuvable.</section>

  async function createBooking() {
    setError(null)
    if (!session?.user || !id) {
      setError('Veuillez vous connecter comme parent pour réserver.')
      return
    }
    if (!startsAt || !endsAt) {
      setError('Veuillez renseigner les dates de début et de fin.')
      return
    }
    const starts = new Date(startsAt)
    const ends = new Date(endsAt)
    if (!(starts instanceof Date) || !(ends instanceof Date) || isNaN(starts.getTime()) || isNaN(ends.getTime()) || ends <= starts) {
      setError('Plage horaire invalide.')
      return
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        parent_id: session.user.id,
        teacher_id: id,
        subject_id: subjectId || null,
        neighborhood_id: neighborhoodId || null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single()
    if (error) {
      setError(error.message)
      return
    }
    navigate(`/messages/${data!.id}`)
  }

  return (
    <section className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <img src={profile.avatar_url || '/logo.png'} alt="avatar" width={72} height={72} className="rounded-full" />
        <div>
          <h2 className="text-2xl font-semibold">{profile.full_name || 'Professeur'}</h2>
          <div className="opacity-80">{teacher.bio || ''}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Informations</h3>
          <div className="text-sm">Tarif: {teacher.hourly_rate ? `${teacher.hourly_rate} XAF/h` : '—'}</div>
          <div className="text-sm">Niveaux: {teacher.levels?.join(', ') || '—'}</div>
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Matières</h3>
          <div className="text-sm">{subjects.length ? subjects.join(', ') : '—'}</div>
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">Quartiers</h3>
          <div className="text-sm">{neighborhoods.length ? neighborhoods.join(', ') : '—'}</div>
        </div>
      </div>

      <div className="border rounded p-3 space-y-3">
        <h3 className="font-semibold">Réserver un créneau</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Début
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} />
          </label>
          <label className="text-sm">
            Fin
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} />
          </label>
          <label className="text-sm">
            Matière (optionnel)
            <select className="mt-1 w-full border p-2 rounded" value={subjectId} onChange={(e)=>setSubjectId(e.target.value?Number(e.target.value):'')}>
              <option value="">—</option>
              {subjectsList.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Quartier (optionnel)
            <select className="mt-1 w-full border p-2 rounded" value={neighborhoodId} onChange={(e)=>setNeighborhoodId(e.target.value?Number(e.target.value):'')}>
              <option value="">—</option>
              {neighborhoodsList.map(n=> <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={createBooking} className="px-4 py-2 border rounded">Réserver</button>
      </div>
    </section>
  )
}
