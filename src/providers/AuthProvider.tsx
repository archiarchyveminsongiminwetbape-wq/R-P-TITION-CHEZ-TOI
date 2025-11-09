import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'parent' | 'teacher' | 'admin' | null

type AuthContextValue = {
  session: Session | null
  role: UserRole
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, role: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)

      if (data.session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()
        setRole((prof?.role as UserRole) ?? null)
      } else {
        setRole(null)
      }
      setLoading(false)
    }

    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s?.user) {
        setRole(null)
      } else {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', s.user.id)
          .single()
          .then(({ data: p }) => setRole((p?.role as UserRole) ?? null))
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, role, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
