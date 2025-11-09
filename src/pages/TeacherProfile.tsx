import { useParams } from 'react-router-dom'

export default function TeacherProfile() {
  const { id } = useParams()
  return (
    <section className="p-6">
      <h2 className="text-xl font-semibold mb-2">Fiche professeur</h2>
      <p className="opacity-80">Professeur ID: {id}</p>
      <p className="opacity-80">Contenu à venir: bio, matières, tarifs, disponibilités, quartiers…</p>
    </section>
  )
}
