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
    return () => {
      supabase.removeChannel(ch)
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
