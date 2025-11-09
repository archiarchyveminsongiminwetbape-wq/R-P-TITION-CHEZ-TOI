import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

export default function Messages() {
  const { bookingId } = useParams()
  const { session } = useAuth()
  const [messages, setMessages] = useState<Array<{ id: string; body: string; created_at: string; sender_id: string }>>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('id,body,created_at,sender_id')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })
      if (!mounted) return
      setMessages(data ?? [])
      setLoading(false)
    }
    load()
    const ch = supabase
      .channel('messages-booking-' + bookingId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` }, () => load())
      .subscribe()
    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [bookingId])

  async function send() {
    if (!text.trim() || !bookingId) return
    await supabase.from('messages').insert({ booking_id: bookingId, sender_id: session?.user.id, body: text.trim() })
    setText('')
  }

  return (
    <section className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Messagerie</h2>
      {loading && <p>Chargement…</p>}
      <div className="border rounded p-3 h-80 overflow-auto bg-white/50">
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 ${m.sender_id === session?.user.id ? 'text-right' : ''}`}>
            <div className="inline-block px-3 py-2 rounded border bg-white">
              <div className="text-sm">{m.body}</div>
              <div className="text-xs opacity-60">{new Date(m.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {!loading && messages.length === 0 && <div className="opacity-70">Aucun message</div>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border p-2 rounded" value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message" />
        <button onClick={send} className="px-4 py-2 border rounded">Envoyer</button>
      </div>
    </section>
  )
}
