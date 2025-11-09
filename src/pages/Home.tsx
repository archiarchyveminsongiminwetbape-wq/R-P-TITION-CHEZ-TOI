import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <section className="p-6">
      <h2 className="text-2xl font-semibold mb-2">{t('title')}</h2>
      <p className="opacity-80">{t('subtitle')}</p>
      <div className="mt-6 flex gap-3">
        <a href="/search" className="px-4 py-2 border rounded-md">{t('cta')}</a>
      </div>
    </section>
  )
}
