import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useTranslation } from 'react-i18next'

type BookingRow = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  teacher_id: string
  subject_id: number | null
}

export default function DashboardParent() {
  const { session } = useAuth()
  const [rows, setRows] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Record<string, { full_name: string | null }>>({})
  const { t } = useTranslation()

  const statusLabel = (status: string) => t(`dashboard.status_${status}` as 'dashboard.status_pending')

  const statusClass = (status: string) => {
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200'
    if (status === 'completed') return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('id,starts_at,ends_at,status,teacher_id,subject_id')
      .eq('parent_id', session?.user.id)
      .order('starts_at', { ascending: false })
    const bookings = (data as any as BookingRow[]) ?? []
    setRows(bookings)

    const teacherIds = Array.from(new Set(bookings.map((b) => b.teacher_id).filter(Boolean)))
    if (teacherIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id,full_name')
        .in('id', teacherIds)
      const map: Record<string, { full_name: string | null }> = {}
      for (const p of (profs as any[]) ?? []) {
        map[p.id] = { full_name: p.full_name as string | null }
      }
      setTeachers(map)
    } else {
      setTeachers({})
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // live updates
    const ch = supabase
      .channel('parent-bookings-' + (session?.user.id || ''))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `parent_id=eq.${session?.user.id}` }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [session?.user.id])

  async function cancel(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  return (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">{t('dashboard.parent_title')}</h2>

      {loading && <p>{t('dashboard.parent_loading')}</p>}

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">{t('dashboard.parent_my_bookings')}</div>
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {teachers[r.teacher_id]?.full_name || '—'}
                </div>
                <div className="text-sm">{t('dashboard.parent_start')}: {new Date(r.starts_at).toLocaleString()}</div>
                <div className="text-sm">{t('dashboard.parent_end')}: {new Date(r.ends_at).toLocaleString()}</div>
                <div className="text-sm flex items-center gap-2">
                  <span>{t('dashboard.parent_status')}:</span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusClass(r.status)}`}>
                    {statusLabel(r.status)}
                  </span>
                </div>
              </div>
              <a className="px-3 py-2 border rounded" href={`/messages/${r.id}`}>{t('dashboard.parent_messages')}</a>
              {r.status !== 'cancelled' && r.status !== 'completed' && (
                <button className="px-3 py-2 border rounded" onClick={() => cancel(r.id)}>{t('dashboard.parent_cancel')}</button>
              )}
            </li>
          ))}
          {!loading && rows.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">
              {t('dashboard.parent_none')}
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}
