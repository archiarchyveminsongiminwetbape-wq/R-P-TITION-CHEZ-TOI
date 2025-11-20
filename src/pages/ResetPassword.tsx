import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../providers/ToastProvider'
import { useTranslation } from 'react-i18next'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && type !== 'recovery') {
      setInfo('Lien invalide ou expiré. Veuillez recommencer la procédure de réinitialisation.')
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    try {
      if (!hasSupabaseConfig) throw new Error('Configuration Supabase manquante.')
      setLoading(true)
      const { error: updateError } = await supabase!.auth.updateUser({ password })
      if (updateError) throw updateError

      toast({ variant: 'success', title: t('auth.reset_title') })
      setInfo('Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.')

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la mise à jour du mot de passe.'
      setError(msg)
      toast({ variant: 'error', title: t('toast.error'), description: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <h2 className="text-2xl font-semibold mb-4">{t('auth.reset_title')}</h2>
      <div className="rounded-lg border p-5 shadow-sm bg-white">
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            type="password"
            placeholder={t('auth.reset_new_password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            type="password"
            placeholder={t('auth.reset_confirm_password')}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {info && !error && <p className="text-emerald-700 text-sm">{info}</p>}
          <button
            className="w-full px-4 py-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60 text-base"
            disabled={loading}
          >
            {loading ? '...' : t('auth.reset_submit')}
          </button>
        </form>
      </div>
    </section>
  )
}
