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
  const [parents, setParents] = useState<Record<string, { full_name: string | null }>>({})
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const statusClass = (status: string) => {
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200'
    if (status === 'completed') return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const statusLabel = (status: string) => t(`dashboard.status_${status}` as 'dashboard.status_pending')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('id,starts_at,ends_at,status,parent_id,subject_id')
      .eq('teacher_id', session?.user.id)
      .order('starts_at', { ascending: false })
    const bookings = (data as any as BookingRow[]) ?? []
    setRows(bookings)

    const parentIds = Array.from(new Set(bookings.map((b) => b.parent_id).filter(Boolean)))
    if (parentIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id,full_name')
        .in('id', parentIds)
      const map: Record<string, { full_name: string | null }> = {}
      for (const p of (profs as any[]) ?? []) {
        map[p.id] = { full_name: p.full_name as string | null }
      }
      setParents(map)
    } else {
      setParents({})
    }
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
      if (!session?.user.id) return;
      const [{ data: prof }, { data: tprof }] = await Promise.all([
        supabase.from('profiles').select('full_name,avatar_url').eq('id', session.user.id).single(),
        supabase.from('teacher_profiles').select('bio,hourly_rate,levels').eq('user_id', session.user.id).single(),
      ]);
      setFullName((prof?.full_name as string) || '');
      setBio((tprof?.bio as string) || '');
      setRate((tprof?.hourly_rate as number) ?? '');
      setLevels(((tprof?.levels as string[]) || []) as string[]);
      setAvatarUrl(prof?.avatar_url || null);
      
      const [{ data: subs }, { data: neis }, { data: linkSubs }, { data: linkNeis }] = await Promise.all([
        supabase.from('subjects').select('id,name').order('name'),
        supabase.from('neighborhoods').select('id,name').order('name'),
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', session.user.id),
        supabase.from('teacher_neighborhoods').select('neighborhood_id').eq('teacher_id', session.user.id),
      ]);
      setSubjects((subs as any) ?? []);
      setNeighborhoods((neis as any) ?? []);
      setSelectedSubjects(((linkSubs as any) ?? []).map((x: any) => x.subject_id));
      setSelectedNeighborhoods(((linkNeis as any) ?? []).map((x: any) => x.neighborhood_id));
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
    if (!session?.user.id) return;
    try {
      setSaving(true);
      setNotice(null);
      
      let avatar_url = avatarUrl; // Conserver l'URL existante par défaut
      
      // Upload du nouvel avatar si un fichier a été sélectionné
      if (avatarFile) {
        try {
          const ext = avatarFile.name.split('.').pop() || 'png';
          const fileName = `${session.user.id}/${Date.now()}.${ext}`;
          
          // Supprimer l'ancien avatar s'il existe
          if (avatarUrl) {
            const oldFileName = avatarUrl.split('/').pop();
            if (oldFileName) {
              await supabase.storage
                .from('avatars')
                .remove([`${session.user.id}/${oldFileName}`])
                .catch(console.error); // Ne pas échouer si la suppression échoue
            }
          }
          
          // Upload du nouveau fichier
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { 
              cacheControl: '3600',
              upsert: true 
            });
            
          if (uploadError) throw uploadError;
          
          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          avatar_url = publicUrl;
          setAvatarUrl(publicUrl);
          
          toast({
            variant: 'success',
            title: 'Succès',
            description: 'Photo de profil mise à jour avec succès'
          });
          
        } catch (error) {
          console.error('Erreur lors de l\'upload de l\'avatar:', error);
          throw new Error('Erreur lors de la mise à jour de la photo de profil');
        }
      }

      // Mise à jour du profil
      const profUpdate: any = { full_name: fullName };
      if (avatar_url) profUpdate.avatar_url = avatar_url;
      
      await supabase
        .from('profiles')
        .update(profUpdate)
        .eq('id', session.user.id);
        
      await supabase.from('teacher_profiles')
        .update({ bio, hourly_rate: rate === '' ? null : Number(rate), levels })
        .eq('user_id', session.user.id);
        
      // sync join tables (simple approach: delete then insert)
      await supabase.from('teacher_subjects').delete().eq('teacher_id', session.user.id);
      if (selectedSubjects.length) {
        await supabase.from('teacher_subjects')
          .insert(selectedSubjects.map((sid) => ({ teacher_id: session.user.id, subject_id: sid })));
      }
      
      await supabase.from('teacher_neighborhoods').delete().eq('teacher_id', session.user.id);
      if (selectedNeighborhoods.length) {
        await supabase.from('teacher_neighborhoods')
          .insert(selectedNeighborhoods.map((nid) => ({ teacher_id: session.user.id, neighborhood_id: nid })));
      }
      
      setNotice('Profil enregistré avec succès');
      toast({ 
        variant: 'success', 
        title: t('toast.saved'),
        description: 'Vos modifications ont été enregistrées'
      });
      
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue lors de la sauvegarde';
      console.error('Erreur lors de la sauvegarde du profil:', error);
      setNotice(errorMessage);
      toast({ 
        variant: 'error', 
        title: 'Erreur', 
        description: errorMessage 
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">{t('dashboard.teacher_title')}</h2>

      {loading && <p>{t('dashboard.parent_loading')}</p>}
      {notice && <p className="text-sm p-2 border rounded bg-white/70">{notice}</p>}

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">{t('dashboard.teacher_profile_section')}</div>
        <div className="p-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            {t('auth.full_name')}
            <input className="mt-1 w-full border p-2 rounded" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
          </label>
          <label className="text-sm">
            {t('dashboard.teacher_hourly_rate')}
            <input className="mt-1 w-full border p-2 rounded" type="number" min="0" value={rate} onChange={(e)=>setRate(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm md:col-span-2">
            {t('dashboard.teacher_bio')}
            <textarea className="mt-1 w-full border p-2 rounded" rows={3} value={bio} onChange={(e)=>setBio(e.target.value)} />
          </label>
          <div className="text-sm">
            {t('dashboard.teacher_levels')}
            <div className="mt-1 flex gap-3 items-center">
              <label><input type="checkbox" checked={levelChecked('college')} onChange={()=>toggleLevel('college')} /> {t('dashboard.teacher_level_college')}</label>
              <label><input type="checkbox" checked={levelChecked('lycee')} onChange={()=>toggleLevel('lycee')} /> {t('dashboard.teacher_level_lycee')}</label>
            </div>
          </div>
          <label className="text-sm">
            {t('dashboard.teacher_avatar')}
            <div className="mt-2 flex items-center gap-4">
              {avatarUrl && (
                <img 
                  src={avatarUrl} 
                  alt="Avatar actuel" 
                  className="w-16 h-16 rounded-full object-cover border"
                />
              )}
              <div className="flex-1">
                <input 
                  className="w-full" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Vérifier la taille du fichier (max 2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        toast({
                          variant: 'error',
                          title: 'Erreur',
                          description: 'La taille de l\'image ne doit pas dépasser 2MB'
                        });
                        return;
                      }
                      setAvatarFile(file);
                      // Aperçu de l'image
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setAvatarUrl(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés : JPG, PNG, GIF (max 2MB)
                </p>
              </div>
            </div>
          </label>
          <div className="text-sm">
            {t('dashboard.teacher_subjects')}
            <div className="mt-1 grid grid-cols-2 gap-2">
              {subjects.map(s => (
                <label key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={()=>setSelectedSubjects(toggleArray(selectedSubjects, s.id))} /> {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="text-sm">
            {t('dashboard.teacher_neighborhoods')}
            <div className="mt-1 grid grid-cols-2 gap-2">
              {neighborhoods.map(n => (
                <label key={n.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedNeighborhoods.includes(n.id)} onChange={()=>setSelectedNeighborhoods(toggleArray(selectedNeighborhoods, n.id))} /> {n.name}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="px-3 py-2 border rounded" disabled={saving} onClick={saveProfile}>{saving ? t('dashboard.teacher_saving') : t('dashboard.teacher_save')}</button>
          </div>
        </div>
      </div>

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">{t('dashboard.teacher_availabilities')}</div>
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
            {t('dashboard.teacher_add')}
          </button>
        </div>
        <ul className="divide-y">
          {avails.map(a=> (
            <li key={a.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 text-sm">
                <span className="font-medium mr-2">{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.weekday]}</span>
                {a.start_time} - {a.end_time}
              </div>
              <button className="px-3 py-1 border rounded" onClick={async ()=>{ await supabase.from('availabilities').delete().eq('id', a.id) }}>{t('dashboard.teacher_delete')}</button>
            </li>
          ))}
          {avails.length === 0 && <li className="p-3 opacity-70">{t('dashboard.teacher_no_availability')}</li>}
        </ul>
      </div>

      <div className="border rounded">
        <div className="p-3 font-semibold border-b">{t('dashboard.teacher_requests')}</div>
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {parents[r.parent_id]?.full_name || '—'}
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
              {r.status === 'pending' && (
                <>
                  <button className="px-3 py-2 border rounded" onClick={() => updateStatus(r.id, 'confirmed')}>{t('dashboard.teacher_confirm')}</button>
                  <button className="px-3 py-2 border rounded" onClick={() => updateStatus(r.id, 'cancelled')}>{t('dashboard.teacher_cancel')}</button>
                </>
              )}
            </li>
          ))}
          {!loading && rows.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">
              {t('dashboard.teacher_none')}
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}
