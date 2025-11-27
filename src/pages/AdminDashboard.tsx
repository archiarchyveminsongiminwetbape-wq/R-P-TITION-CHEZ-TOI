import * as React from "react"
import { adminService } from "../services/api/adminService"
import type { ApplicationStats, AdminTeacher, AdminParent, AdminBooking, AdminMessage, AdminReview } from "../types"

/**
 * Page d'administration principale
 * Voir toutes les statistiques et données de l'application
 */
export default function AdminDashboard() {
  const [stats, setStats] = React.useState<ApplicationStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('stats')

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const result = await adminService.getApplicationStats()
    if (result.data) {
      setStats(result.data as ApplicationStats)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 text-slate-900">Tableau de Bord Admin</h1>
        <p className="text-slate-600 mb-8">Gestion complète de la plateforme</p>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard 
            title="Utilisateurs" 
            value={stats?.profiles || 0}
            description="Profils totaux"
            color="bg-blue"
          />
          <StatCard 
            title="Enseignants" 
            value={stats?.teachers || 0}
            description="Professeurs inscrits"
            color="bg-green"
          />
          <StatCard 
            title="Parents" 
            value={stats?.parents || 0}
            description="Parents inscrits"
            color="bg-purple"
          />
          <StatCard 
            title="Réservations" 
            value={stats?.bookings?.total || 0}
            description="Total des cours"
            color="bg-orange"
          />
          <StatCard 
            title="Messages" 
            value={stats?.messages || 0}
            description="Échanges"
            color="bg-pink"
          />
        </div>

        {/* Détails des Réservations */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">État des Réservations</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600">{stats?.bookings?.pending || 0}</div>
              <p className="text-sm text-gray-600 mt-2">En attente</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{stats?.bookings?.confirmed || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Confirmées</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{stats?.bookings?.completed || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Complétées</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{stats?.bookings?.cancelled || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Annulées</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b flex">
            {[
              { id: 'teachers', label: 'Enseignants' },
              { id: 'parents', label: 'Parents' },
              { id: 'bookings', label: 'Réservations' },
              { id: 'messages', label: 'Messages' },
              { id: 'reviews', label: 'Avis' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'teachers' && <AdminTeachers />}
            {activeTab === 'parents' && <AdminParents />}
            {activeTab === 'bookings' && <AdminBookings />}
            {activeTab === 'messages' && <AdminMessages />}
            {activeTab === 'reviews' && <AdminReviews />}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  description: string
  color: string
}

function StatCard({ title, value, description, color }: StatCardProps) {
  const colorClasses = {
    'bg-blue': 'bg-blue-50 border-blue-200 text-blue-600',
    'bg-green': 'bg-green-50 border-green-200 text-green-600',
    'bg-purple': 'bg-purple-50 border-purple-200 text-purple-600',
    'bg-orange': 'bg-orange-50 border-orange-200 text-orange-600',
    'bg-pink': 'bg-pink-50 border-pink-200 text-pink-600'
  }
  
  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-6 border`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className="text-3xl font-bold mt-2">{value}</div>
      <p className="text-xs text-gray-600 mt-1">{description}</p>
    </div>
  )
}

function AdminTeachers() {
  const [teachers, setTeachers] = React.useState<AdminTeacher[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    const result = await adminService.getAllTeachers()
    if (result.data) {
      setTeachers(result.data as AdminTeacher[])
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Liste des Enseignants ({teachers.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nom</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarif Horaire</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Niveaux</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Sujets</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Adresse</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.user_id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium">{teacher.profile?.full_name || 'N/A'}</td>
                <td className="px-4 py-3">{teacher.hourly_rate ? `${teacher.hourly_rate} FCFA/h` : 'N/A'}</td>
                <td className="px-4 py-3">{teacher.levels?.join(', ') || 'N/A'}</td>
                <td className="px-4 py-3">
                  {teacher.subjects?.map((s: { subject: { id: number; name: string } }) => s.subject.name).join(', ') || 'N/A'}
                </td>
                <td className="px-4 py-3">{teacher.address || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminParents() {
  const [parents, setParents] = React.useState<AdminParent[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadParents()
  }, [])

  const loadParents = async () => {
    const result = await adminService.getAllParents()
    if (result.data) {
      setParents(result.data as AdminParent[])
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Liste des Parents ({parents.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nom</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Téléphone</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Enfants</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Inscrit depuis</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((parent) => (
              <tr key={parent.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium">{parent.full_name || 'N/A'}</td>
                <td className="px-4 py-3">{parent.phone || 'N/A'}</td>
                <td className="px-4 py-3">{parent.children?.length || 0}</td>
                <td className="px-4 py-3">{new Date(parent.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminBookings() {
  const [bookings, setBookings] = React.useState<AdminBooking[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    const result = await adminService.getAllBookings()
    if (result.data) {
      setBookings(result.data as AdminBooking[])
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Toutes les Réservations ({bookings.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Parent</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Enseignant</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3">{booking.parent?.full_name || 'N/A'}</td>
                <td className="px-4 py-3">{booking.teacher?.user_id ? 'Enseignant' : 'N/A'}</td>
                <td className="px-4 py-3">{new Date(booking.starts_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminMessages() {
  const [messages, setMessages] = React.useState<AdminMessage[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    const result = await adminService.getAllMessages(50)
    if (result.data) {
      setMessages(result.data as AdminMessage[])
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Tous les Messages (Derniers 50)</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex justify-between mb-2">
              <strong className="text-gray-900">{message.sender?.full_name || 'Utilisateur'}</strong>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <p className="text-sm text-gray-700">{message.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminReviews() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    const result = await adminService.getAllReviews()
    if (result.data) {
      setReviews(result.data as AdminReview[])
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Tous les Avis ({reviews.length})</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex justify-between mb-2">
              <div>
                <strong className="text-gray-900">{review.parent?.full_name || 'Parent'}</strong>
                <span className="text-gray-600 mx-2">→</span>
                <strong className="text-gray-900">Enseignant</strong>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} style={{fontSize: '1.25rem'}}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
