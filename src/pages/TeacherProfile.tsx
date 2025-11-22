import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'

type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type Teacher = { user_id: string; bio: string | null; hourly_rate: number | null; levels: string[] | null }
type Review = { id: string; booking_id: string; parent_id: string; rating: number; comment: string | null; created_at: string }

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
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<Array<{ weekday: number; start_time: string; end_time: string }>>([])
  const [bookedSlots, setBookedSlots] = useState<Array<{ starts_at: string; ends_at: string }>>([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingInfo, setBookingInfo] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!id || !dateDay) return
    async function loadBooked() {
      const { data } = await supabase
        .from('bookings')
        .select('starts_at,ends_at')
        .eq('teacher_id', id)
        .in('status', ['pending','confirmed'])
        .gte('starts_at', `${dateDay}T00:00:00`)
        .lt('starts_at', `${dateDay}T23:59:59`)
      setBookedSlots((data as any) ?? [])
    }
    loadBooked()
  }, [id, dateDay])

  useEffect(() => {
    if (!id) return
    async function loadReviews() {
      const [{ data: revs }, completedRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('id,booking_id,parent_id,rating,comment,created_at')
          .eq('teacher_id', id)
          .order('created_at', { ascending: false }),
        session?.user
          ? supabase
              .from('bookings')
              .select('id,created_at')
              .eq('teacher_id', id)
              .eq('parent_id', session.user.id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: null } as any),
      ])

      const list = (revs as any[] | null) ?? []
      setReviews(list as Review[])
      const count = list.length
      setReviewCount(count)
      setAverageRating(count ? list.reduce((s, r: any) => s + r.rating, 0) / count : null)

      if (session?.user && completedRes.data) {
        const completed = (completedRes.data as any[]) ?? []
        const reviewedByParent = new Set(
          list
            .filter((r: any) => r.parent_id === session.user.id)
            .map((r: any) => r.booking_id),
        )
        const eligible = completed.find((b: any) => !reviewedByParent.has(b.id))
        setEligibleBookingId(eligible?.id || null)
      } else {
        setEligibleBookingId(null)
      }
    }
    loadReviews()
  }, [id, session?.user?.id])

  if (loading) return <section className="p-6">{t('search.loading')}</section>
  if (!profile || !teacher) return <section className="p-6">{t('teacher.not_found')}</section>

  function applySlotToDate(slot: { start_time: string; end_time: string }) {
    if (!dateDay) return
    const startISO = `${dateDay}T${slot.start_time}`
    const endISO = `${dateDay}T${slot.end_time}`
    setStartsAt(startISO)
    setEndsAt(endISO)
  }

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user || !id || !eligibleBookingId) return
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Note invalide')
      return
    }
    try {
      setReviewSubmitting(true)
      setReviewError(null)
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: eligibleBookingId,
          parent_id: session.user.id,
          teacher_id: id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })
        .select('id,booking_id,parent_id,rating,comment,created_at')
        .single()
      if (error) throw error
      const newReview = data as any as Review
      const newCount = reviewCount + 1
      const newAvg = ((averageRating || 0) * reviewCount + newReview.rating) / newCount
      setReviews((prev) => [newReview, ...prev])
      setReviewCount(newCount)
      setAverageRating(newAvg)
      setEligibleBookingId(null)
      setReviewRating(5)
      setReviewComment('')
    } catch (err: any) {
      setReviewError(err?.message || 'Erreur lors de l\'envoi de l\'avis')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function createBooking() {
    if (bookingLoading) return
    setBookingInfo(null)
    setBookingLoading(true)
    setError(null)
    if (!session?.user || !id) {
      setError('Veuillez vous connecter comme parent pour réserver.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Veuillez vous connecter comme parent pour réserver.' })
      setBookingLoading(false)
      return
    }
    if (!startsAt || !endsAt) {
      setError('Veuillez renseigner les dates de début et de fin.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Veuillez renseigner les dates de début et de fin.' })
      setBookingLoading(false)
      return
    }
    const starts = new Date(startsAt)
    const ends = new Date(endsAt)
    if (!(starts instanceof Date) || !(ends instanceof Date) || isNaN(starts.getTime()) || isNaN(ends.getTime()) || ends <= starts) {
      setError('Plage horaire invalide.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Plage horaire invalide.' })
      setBookingLoading(false)
      return
    }
    // Optionally, we could validate against availabilities, but we relax this check
    // to avoid blocking parents when a slot is otherwise acceptable and not overlapping.
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
      setBookingLoading(false)
      return
    }
    if ((overlaps?.length || 0) > 0) {
      setError('Ce créneau chevauche une autre réservation.')
      toast({ variant: 'error', title: t('toast.error'), description: 'Ce créneau chevauche une autre réservation.' })
      setBookingLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        parent_id: session.user.id,
        teacher_id: id,
        subject_id: selectedSubjectIds[0] || null,
        neighborhood_id: neighborhoodId || null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single()
    if (error) {
      toast({ variant: 'error', title: t('toast.error'), description: error.message })
      setBookingLoading(false)
    } else if (data && data.id) {
      if (selectedSubjectIds.length) {
        await supabase
          .from('booking_subjects')
          .insert(selectedSubjectIds.map((sid) => ({ booking_id: data.id, subject_id: sid })))
      }
      toast({ variant: 'success', title: t('toast.booking_ok') })
      setBookingInfo('Réservation créée, ouverture de la messagerie...')
      setBookingLoading(false)
      navigate(`/messages/${data.id}`)
    }
  }

  return (
    <section className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <img src={profile.avatar_url || '/logo.png'} alt="avatar" width={72} height={72} className="rounded-full" />
        <div>
          <h2 className="text-2xl font-semibold">{profile.full_name || t('search.teacher_label')}</h2>
          <div className="opacity-80">{teacher.bio || ''}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">{t('teacher.info')}</h3>
          <div className="text-sm">{t('search.price')}: {teacher.hourly_rate ? `${teacher.hourly_rate} XAF/h` : '—'}</div>
          <div className="text-sm">{t('dashboard.teacher_levels')}: {teacher.levels?.join(', ') || '—'}</div>
          {averageRating !== null && reviewCount > 0 && (
            <div className="text-sm mt-1">
              {t('teacher.reviews_average')}: {averageRating.toFixed(1)} / 5 · {reviewCount} avis
            </div>
          )}
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">{t('teacher.subjects')}</h3>
          <div className="text-sm">{subjects.length ? subjects.join(', ') : '—'}</div>
        </div>
        <div className="border rounded p-3">
          <h3 className="font-semibold mb-2">{t('teacher.neighborhoods')}</h3>
          <div className="text-sm">{neighborhoods.length ? neighborhoods.join(', ') : '—'}</div>
        </div>
        <div className="border rounded p-3 md:col-span-2">
          <h3 className="font-semibold mb-2">{t('teacher.availabilities')}</h3>
          <ul className="grid md:grid-cols-2 gap-2 text-sm">
            {availabilities.map((a, i) => (
              <li key={i} className="border rounded p-2 bg-white/50">
                <span className="font-medium mr-2">{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]}</span>
                {a.start_time} - {a.end_time}
              </li>
            ))}
            {availabilities.length === 0 && <li className="opacity-70">{t('teacher.no_availability')}</li>}
          </ul>
        </div>
      </div>

      <div className="border rounded p-3 space-y-3">
        <h3 className="font-semibold">{t('teacher.booking_section')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            {t('teacher.booking_date')}
            <input type="date" className="mt-1 w-full border p-2 rounded" value={dateDay} onChange={(e)=>setDateDay(e.target.value)} />
          </label>
          <label className="text-sm">
            {t('teacher.booking_start')}
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} />
          </label>
          <label className="text-sm">
            {t('teacher.booking_end')}
            <input type="datetime-local" className="mt-1 w-full border p-2 rounded" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} />
          </label>
          {dateDay && (
            <label className="text-sm md:col-span-2">
              {t('teacher.booking_slot_helper')}
              <select className="mt-1 w-full border p-2 rounded" onChange={(e)=>{
                const idx = Number(e.target.value); if (!isNaN(idx)) applySlotToDate(availabilities[idx])
              }}>
                <option value="">—</option>
                {availabilities
                  .map((a, i)=>({a,i}))
                  .filter(({a})=>{
                    const wd = new Date(dateDay + 'T00:00:00').getDay();
                    if (a.weekday !== wd) return false
                    // hide slots that overlap existing bookings for this date
                    return !bookedSlots.some(b => {
                      const bs = b.starts_at.substring(11,16)
                      const be = b.ends_at.substring(11,16)
                      return !(be <= a.start_time || bs >= a.end_time)
                    })
                  })
                  .map(({a,i})=> (
                    <option key={i} value={i}>{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]} {a.start_time} - {a.end_time}</option>
                  ))}
              </select>
            </label>
          )}
          <div className="text-sm">
            {t('teacher.booking_subjects_optional')}
            <div className="mt-1 grid grid-cols-2 gap-2">
              {subjectsList.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(s.id)}
                    onChange={() => toggleSubject(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <label className="text-sm">
            {t('teacher.booking_neighborhood_optional')}
            <select className="mt-1 w-full border p-2 rounded" value={neighborhoodId} onChange={(e)=>setNeighborhoodId(e.target.value?Number(e.target.value):'')}>
              <option value="">—</option>
              {neighborhoodsList.map(n=> <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {bookingInfo && !error && <p className="text-emerald-700 text-sm">{bookingInfo}</p>}
        <button
          onClick={createBooking}
          disabled={bookingLoading}
          className="w-full sm:w-auto px-4 py-3 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition text-base disabled:opacity-60"
        >
          {bookingLoading ? '...' : t('teacher.booking_submit')}
        </button>
      </div>

      <div className="border rounded p-3 space-y-3">
        <h3 className="font-semibold">{t('teacher.reviews_title')}</h3>
        {reviewCount === 0 && (
          <p className="text-sm text-slate-500">{t('teacher.reviews_none')}</p>
        )}
        {reviewCount > 0 && (
          <ul className="space-y-2 text-sm">
            {reviews.map((r) => (
              <li key={r.id} className="border rounded p-2 bg-white/60">
                <div className="font-medium">{r.rating} / 5</div>
                {r.comment && <div className="mt-1">{r.comment}</div>}
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}

        {eligibleBookingId && session?.user && (
          <form onSubmit={submitReview} className="space-y-2 pt-3 border-t mt-2">
            <h4 className="font-semibold text-sm">{t('teacher.reviews_form_title')}</h4>
            {reviewError && <p className="text-red-600 text-xs">{reviewError}</p>}
            <label className="text-xs block">
              {t('teacher.reviews_rating_label')}
              <select
                className="mt-1 w-full border rounded p-1 text-sm"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="text-xs block">
              {t('teacher.reviews_comment_label')}
              <textarea
                className="mt-1 w-full border rounded p-2 text-sm"
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {reviewSubmitting ? '...' : t('teacher.reviews_submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
