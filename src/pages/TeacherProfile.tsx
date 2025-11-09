import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'

type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type Teacher = { user_id: string; bio: string | null; hourly_rate: number | null; levels: string[] | null }

export default function TeacherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectsList, setSubjectsList] = useState<Array<{id:number;name:string}>>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [neighborhoodsList, setNeighborhoodsList] = useState<Array<{id:number;name:string}>>([])
  const [loading, setLoading] = useState(true)
  const [dateDay, setDateDay] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [neighborhoodId, setNeighborhoodId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<Array<{ weekday: number; start_time: string; end_time: string }>>([])

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

      const [{ data: subjLinks }, { data: neiLinks }, { data: allSubj }, { data: allNei }, { data: avs }] = await Promise.all([
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', id),
        supabase.from('teacher_neighborhoods').select('neighborhood_id').eq('teacher_id', id),
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('neighborhoods').select('id,name').order('name'),
        supabase.from('availabilities').select('weekday,start_time,end_time').eq('teacher_id', id).order('weekday', { ascending: true }).order('start_time', { ascending: true }),
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
      setAvailabilities((avs ?? []) as any)

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <section className="p-6">Chargement…</section>
  if (!profile || !teacher) return <section className="p-6">Professeur introuvable.</section>

  function applySlotToDate(slot: { start_time: string; end_time: string }) {
    if (!dateDay) return
    const startISO = `${dateDay}T${slot.start_time}`
    const endISO = `${dateDay}T${slot.end_time}`
    setStartsAt(startISO)
    setEndsAt(endISO)
  }

  async function createBooking() {
    setError(null)
    if (!session?.user || !id) {
      setError('Veuillez vous connecter comme parent pour réserver.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Veuillez vous connecter comme parent pour réserver.' })
      return
    }
    if (!startsAt || !endsAt) {
      setError('Veuillez renseigner les dates de début et de fin.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Veuillez renseigner les dates de début et de fin.' })
      return
    }
    const starts = new Date(startsAt)
    const ends = new Date(endsAt)
    if (!(starts instanceof Date) || !(ends instanceof Date) || isNaN(starts.getTime()) || isNaN(ends.getTime()) || ends <= starts) {
      setError('Plage horaire invalide.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Plage horaire invalide.' })
      return
    }
    // Validate against availabilities of the teacher (same weekday, within a range)
    const weekday = starts.getDay() // 0-6
    const toHM = (d: Date) => {
      const h = d.getHours().toString().padStart(2, '0')
      const m = d.getMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    }
    const sHM = toHM(starts)
    const eHM = toHM(ends)
    const fits = availabilities.some((a) => a.weekday === weekday && a.start_time <= sHM && a.end_time >= eHM)
    if (!fits) {
      setError("Le créneau demandé n'est pas dans les disponibilités du professeur.")
      toast({ variant: 'error', title: t('toast.error'), description: "Le créneau demandé n'est pas dans les disponibilités du professeur." })
      return
    }
    // Overlap check: any booking for this teacher with status pending/confirmed where
    // existing.starts_at < requested.ends AND existing.ends_at > requested.starts
    const { data: overlaps, error: ovErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('teacher_id', id)
      .in('status', ['pending','confirmed'])
      .lt('starts_at', ends.toISOString())
      .gt('ends_at', starts.toISOString())

    if (ovErr) {
      setError(ovErr.message)
      toast({ variant: 'error', title: t('toast.error'), description: ovErr.message })
      return
    }
    if ((overlaps?.length || 0) > 0) {
      setError('Ce créneau chevauche une autre réservation.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Ce créneau chevauche une autre réservation.' })
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
      toast({ variant: 'error', title: t('toast.error'), description: error.message })
    } else if (data && data.id) {
      toast({ variant: 'success', title: t('toast.booking_ok') })
      navigate(`/messages/${data.id}`)
    }
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
        <div className="border rounded p-3 md:col-span-2">
          <h3 className="font-semibold mb-2">Disponibilités</h3>
          <ul className="grid md:grid-cols-2 gap-2 text-sm">
            {availabilities.map((a, i) => (
              <li key={i} className="border rounded p-2 bg-white/50">
                <span className="font-medium mr-2">{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]}</span>
                {a.start_time} - {a.end_time}
              </li>
            ))}
            {availabilities.length === 0 && <li className="opacity-70">Aucune disponibilité</li>}
          </ul>
        </div>
      </div>

      <div className="border rounded p-3 space-y-3">
        <h3 className="font-semibold">Réserver un créneau</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Date
            <input type="date" className="mt-1 w-full border p-2 rounded" value={dateDay} onChange={(e)=>setDateDay(e.target.value)} />
          </label>
          <label className="text-sm">
            Début
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} />
          </label>
          <label className="text-sm">
            Fin
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} />
          </label>
          {dateDay && (
            <label className="text-sm md:col-span-2">
              Choisir un créneau disponible (préremplissage)
              <select className="mt-1 w-full border p-2 rounded" onChange={(e)=>{
                const idx = Number(e.target.value); if (!isNaN(idx)) applySlotToDate(availabilities[idx])
              }}>
                <option value="">—</option>
                {availabilities
                  .map((a, i)=>({a,i}))
                  .filter(({a})=>{
                    const wd = new Date(dateDay + 'T00:00:00').getDay();
                    return a.weekday === wd
                  })
                  .map(({a,i})=> (
                    <option key={i} value={i}>{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]} {a.start_time} - {a.end_time}</option>
                  ))}
              </select>
            </label>
          )}
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
