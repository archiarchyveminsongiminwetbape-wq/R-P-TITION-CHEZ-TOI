import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'

type BookingRow = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  parent_id: string
  subject_id: number | null
}

export default function DashboardTeacher() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { session } = useAuth()
  const [rows, setRows] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [avails, setAvails] = useState<Array<{ id: string; weekday: number; start_time: string; end_time: string }>>([])
  const [weekday, setWeekday] = useState<number>(1)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  // Profile edit state
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [rate, setRate] = useState<number | ''>('')
  const [levels, setLevels] = useState<string[]>([])
  const [subjects, setSubjects] = useState<Array<{id:number;name:string}>>([])
  const [neighborhoods, setNeighborhoods] = useState<Array<{id:number;name:string}>>([])
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<number[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('id,starts_at,ends_at,status,parent_id,subject_id')
      .eq('teacher_id', session?.user.id)
      .order('starts_at', { ascending: false })
    setRows((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase
      .channel('teacher-bookings-' + (session?.user.id || ''))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `teacher_id=eq.${session?.user.id}` }, () => load())
      .subscribe()
    // load availabilities
    async function loadAvails() {
      const { data } = await supabase
        .from('availabilities')
        .select('id,weekday,start_time,end_time')
        .eq('teacher_id', session?.user.id)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true })
      setAvails((data as any) ?? [])
    }
    loadAvails()
    const ch2 = supabase
      .channel('teacher-avails-' + (session?.user.id || ''))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availabilities', filter: `teacher_id=eq.${session?.user.id}` }, () => loadAvails())
      .subscribe()
    // load profile + lists
    async function loadProfile() {
      if (!session?.user.id) return
      const [{ data: prof }, { data: tprof }] = await Promise.all([
        supabase.from('profiles').select('full_name,avatar_url').eq('id', session.user.id).single(),
        supabase.from('teacher_profiles').select('bio,hourly_rate,levels').eq('user_id', session.user.id).single(),
      ])
      setFullName((prof?.full_name as string) || '')
      setBio((tprof?.bio as string) || '')
      setRate((tprof?.hourly_rate as number) ?? '')
      setLevels(((tprof?.levels as string[]) || []) as string[])
      const [{ data: subs }, { data: neis }, { data: linkSubs }, { data: linkNeis }] = await Promise.all([
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('neighborhoods').select('id,name').order('name'),
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', session.user.id),
        supabase.from('teacher_neighborhoods').select('neighborhood_id').eq('teacher_id', session.user.id),
      ])
      setSubjects((subs as any) ?? [])
      setNeighborhoods((neis as any) ?? [])
      setSelectedSubjects(((linkSubs as any) ?? []).map((x: any) => x.subject_id))
      setSelectedNeighborhoods(((linkNeis as any) ?? []).map((x: any) => x.neighborhood_id))
    }
    loadProfile()
    return () => {
      supabase.removeChannel(ch)
      supabase.removeChannel(ch2)
    }
  }, [session?.user.id])

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    await supabase.from('bookings').update({ status }).eq('id', id)
    load()
  }

  const toggleArray = (arr: number[], v: number) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const levelChecked = (l: string) => levels.includes(l)
  const toggleLevel = (l: string) => setLevels(levelChecked(l) ? levels.filter((x) => x !== l) : [...levels, l])

  async function saveProfile() {
    if (!session?.user.id) return
    try {
      setSaving(true)
      setNotice(null)
      // avatar upload first
      let avatar_url: string | undefined
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'png'
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = pub.publicUrl
      }
      // update profile + teacher profile
      const profUpdate: any = { full_name: fullName }
      if (avatar_url) profUpdate.avatar_url = avatar_url
      await supabase.from('profiles').update(profUpdate).eq('id', session.user.id)
      await supabase.from('teacher_profiles')
        .update({ bio, hourly_rate: rate === '' ? null : Number(rate), levels })
        .eq('user_id', session.user.id)
      // sync join tables (simple approach: delete then insert)
      await supabase.from('teacher_subjects').delete().eq('teacher_id', session.user.id)
      if (selectedSubjects.length)
        await supabase.from('teacher_subjects').insert(selectedSubjects.map((sid) => ({ teacher_id: session.user.id, subject_id: sid })))
      await supabase.from('teacher_neighborhoods').delete().eq('teacher_id', session.user.id)
      if (selectedNeighborhoods.length)
        await supabase.from('teacher_neighborhoods').insert(selectedNeighborhoods.map((nid) => ({ teacher_id: session.user.id, neighborhood_id: nid })))
      setNotice('Profil enregistré')
      toast({ variant: 'success', title: t('toast.saved') })
    } catch (e: any) {
      const msg = e.message || 'Erreur lors de la sauvegarde'
      setNotice(msg)
      toast({ variant: 'error', title: t('toast.error'), description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Tableau de bord Professeur</h2>

      {loading && <p>Chargement…</p>}
      {notice && <p className="text-sm p-2 border rounded bg-white/70">{notice}</p>}

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">Mon profil</div>
        <div className="p-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Nom complet
            <input className="mt-1 w-full border p-2 rounded" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
          </label>
          <label className="text-sm">
            Tarif horaire (XAF)
            <input className="mt-1 w-full border p-2 rounded" type="number" min="0" value={rate} onChange={(e)=>setRate(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm md:col-span-2">
            Bio
            <textarea className="mt-1 w-full border p-2 rounded" rows={3} value={bio} onChange={(e)=>setBio(e.target.value)} />
          </label>
          <div className="text-sm">
            Niveaux
            <div className="mt-1 flex gap-3 items-center">
              <label><input type="checkbox" checked={levelChecked('college')} onChange={()=>toggleLevel('college')} /> Collège</label>
              <label><input type="checkbox" checked={levelChecked('lycee')} onChange={()=>toggleLevel('lycee')} /> Lycée</label>
            </div>
          </div>
          <label className="text-sm">
            Avatar
            <input className="mt-1 w-full" type="file" accept="image/*" onChange={(e)=>setAvatarFile(e.target.files?.[0] || null)} />
          </label>
          <div className="text-sm">
            Matières
            <div className="mt-1 grid grid-cols-2 gap-2">
              {subjects.map(s => (
                <label key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={()=>setSelectedSubjects(toggleArray(selectedSubjects, s.id))} /> {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="text-sm">
            Quartiers
            <div className="mt-1 grid grid-cols-2 gap-2">
              {neighborhoods.map(n => (
                <label key={n.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedNeighborhoods.includes(n.id)} onChange={()=>setSelectedNeighborhoods(toggleArray(selectedNeighborhoods, n.id))} /> {n.name}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="px-3 py-2 border rounded" disabled={saving} onClick={saveProfile}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </div>
      </div>

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">Mes disponibilités</div>
        <div className="p-3 grid md:grid-cols-4 gap-3">
          <select className="border p-2 rounded" value={weekday} onChange={(e)=>setWeekday(Number(e.target.value))}>
            <option value={0}>Dim</option>
            <option value={1}>Lun</option>
            <option value={2}>Mar</option>
            <option value={3}>Mer</option>
            <option value={4}>Jeu</option>
            <option value={5}>Ven</option>
            <option value={6}>Sam</option>
          </select>
          <input className="border p-2 rounded" type="time" value={startTime} onChange={(e)=>setStartTime(e.target.value)} />
          <input className="border p-2 rounded" type="time" value={endTime} onChange={(e)=>setEndTime(e.target.value)} />
          <button
            className="border rounded px-3"
            onClick={async () => {
              if (!session?.user) return
              const { data, error } = await supabase
                .from('availabilities')
                .insert({ teacher_id: session.user.id, weekday, start_time: startTime, end_time: endTime })
                .select('id,weekday,start_time,end_time')
                .single()
              if (error || !data) return
              setAvails((prev) =>
                [...prev, data as any].sort((a, b) =>
                  a.weekday === b.weekday
                    ? a.start_time.localeCompare(b.start_time)
                    : a.weekday - b.weekday
                )
              )
            }}
          >
            Ajouter
          </button>
        </div>
        <ul className="divide-y">
          {avails.map(a=> (
            <li key={a.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 text-sm">
                <span className="font-medium mr-2">{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]}</span>
                {a.start_time} - {a.end_time}
              </div>
              <button className="px-3 py-1 border rounded" onClick={async ()=>{ await supabase.from('availabilities').delete().eq('id', a.id) }}>Supprimer</button>
            </li>
          ))}
          {avails.length === 0 && <li className="p-3 opacity-70">Aucune disponibilité</li>}
        </ul>
      </div>

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">Demandes / Réservations</div>
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm">Début: {new Date(r.starts_at).toLocaleString()}</div>
                <div className="text-sm">Fin: {new Date(r.ends_at).toLocaleString()}</div>
                <div className="text-sm">Statut: {r.status}</div>
              </div>
              <a className="px-3 py-2 border rounded" href={`/messages/${r.id}`}>Messages</a>
              {r.status === 'pending' && (
                <>
                  <button className="px-3 py-2 border rounded" onClick={() => updateStatus(r.id, 'confirmed')}>Confirmer</button>
                  <button className="px-3 py-2 border rounded" onClick={() => updateStatus(r.id, 'cancelled')}>Annuler</button>
                </>
              )}
            </li>
          ))}
          {!loading && rows.length === 0 && <li className="p-3 opacity-70">Aucune réservation</li>}
        </ul>
      </div>
    </section>
  )
}
