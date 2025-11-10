import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError()
  let title = 'Une erreur est survenue'
  let message = 'Veuillez réessayer plus tard.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = (error.data as any)?.message ?? message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ opacity: 0.8 }}>{message}</p>
      <a href="/" style={{ textDecoration: 'underline' }}>Retour à l’accueil</a>
    </div>
  )
}
