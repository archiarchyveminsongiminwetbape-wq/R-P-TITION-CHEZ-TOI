import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

type BookingRow = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  parent_id: string
  subject_id: number | null
}

export default function DashboardTeacher() {
  const { session } = useAuth()
  const [rows, setRows] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [avails, setAvails] = useState<Array<{ id: string; weekday: number; start_time: string; end_time: string }>>([])
  const [weekday, setWeekday] = useState<number>(1)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')

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
    return () => {
      supabase.removeChannel(ch)
      supabase.removeChannel(ch2)
    }
  }, [session?.user.id])

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    await supabase.from('bookings').update({ status }).eq('id', id)
    load()
  }

  return (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Tableau de bord Professeur</h2>

      {loading && <p>Chargement…</p>}

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
          <button className="border rounded px-3" onClick={async ()=>{
            if (!session?.user) return
            await supabase.from('availabilities').insert({ teacher_id: session.user.id, weekday, start_time: startTime, end_time: endTime })
          }}>Ajouter</button>
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
