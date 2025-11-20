import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

type Subject = { id: number; name: string }
type Neighborhood = { id: number; name: string }
type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type Teacher = {
  user_id: string
  bio: string | null
  hourly_rate: number | null
  levels: string[] | null
}

export default function Search() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [level, setLevel] = useState<'college' | 'lycee' | ''>('')
  const [neighborhoodId, setNeighborhoodId] = useState<number | ''>('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    async function loadFilters() {
      const [{ data: subs }, { data: neis }] = await Promise.all([
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('neighborhoods').select('id,name').order('name'),
      ])
      setSubjects(subs ?? [])
      setNeighborhoods(neis ?? [])
    }
    loadFilters()
  }, [])

  const filterDeps = useMemo(() => [subjectId, level, neighborhoodId], [subjectId, level, neighborhoodId])

  useEffect(() => {
    async function load() {
      setLoading(true)

      let teacherQuery = supabase.from('teacher_profiles').select('user_id,bio,hourly_rate,levels')

      if (level) {
        teacherQuery = teacherQuery.contains('levels', [level])
      }

      const { data: baseTeachers, error } = await teacherQuery
      if (error) {
        setTeachers([])
        setProfiles({})
        setLoading(false)
        return
      }

      let filtered = baseTeachers as Teacher[]

      if (subjectId) {
        const { data: links } = await supabase
          .from('teacher_subjects')
          .select('teacher_id')
          .eq('subject_id', subjectId)
        const allowed = new Set((links ?? []).map((l: any) => l.teacher_id))
        filtered = filtered.filter((t) => allowed.has(t.user_id))
      }

      if (neighborhoodId) {
        const { data: links } = await supabase
          .from('teacher_neighborhoods')
          .select('teacher_id')
          .eq('neighborhood_id', neighborhoodId)
        const allowed = new Set((links ?? []).map((l: any) => l.teacher_id))
        filtered = filtered.filter((t) => allowed.has(t.user_id))
      }

      setTeachers(filtered)

      const ids = filtered.map((t) => t.user_id)
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id,full_name,avatar_url')
          .in('id', ids)
        const map: Record<string, Profile> = {}
        for (const p of profs ?? []) map[p.id] = p as Profile
        setProfiles(map)
      } else {
        setProfiles({})
      }
      setLoading(false)
    }
    load()
  }, filterDeps)

  return (
    <section className="p-6">
      <h2 className="text-xl font-semibold mb-4">{t('search.title')}</h2>

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <select className="border p-2 rounded" value={subjectId} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{t('search.subject')}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select className="border p-2 rounded" value={level} onChange={(e) => setLevel((e.target.value as any) || '')}>
          <option value="">{t('search.level')}</option>
          <option value="college">{t('search.level_college')}</option>
          <option value="lycee">{t('search.level_lycee')}</option>
        </select>

        <select className="border p-2 rounded" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{t('search.neighborhood')}</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>{t('search.loading')}</p>}

      <ul className="space-y-3">
        {teachers.map((teacher) => {
          const p = profiles[teacher.user_id]
          return (
            <li key={teacher.user_id} className="border rounded p-3 flex items-center gap-3">
              <img src={p?.avatar_url || '/logo.png'} alt="avatar" width={48} height={48} className="rounded-full" />
              <div className="flex-1">
                <div className="font-medium">{p?.full_name || t('search.teacher_label')}</div>
                <div className="text-sm opacity-80">{teacher.bio || ''}</div>
                <div className="text-sm">{t('search.price')}: {teacher.hourly_rate ? `${teacher.hourly_rate} XAF/h` : '—'}</div>
              </div>
              <a className="px-3 py-2 border rounded" href={`/teacher/${teacher.user_id}`}>
                {t('search.see')}
              </a>
            </li>
          )
        })}
        {!loading && teachers.length === 0 && <li className="opacity-70">{t('search.none')}</li>}
      </ul>
    </section>
  )
}
