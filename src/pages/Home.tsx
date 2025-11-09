import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main>
      <section className="px-6 py-12 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t('home.hero_title')}</h1>
          <p className="mt-3 text-slate-600 text-lg">{t('home.hero_subtitle')}</p>
          <div className="mt-6 flex gap-3">
            <a href="/search" className="px-4 py-2 border rounded-md bg-black text-white">{t('home.cta_find_teacher')}</a>
            <a href="/register" className="px-4 py-2 border rounded-md">{t('home.cta_register_teacher')}</a>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold">{t('home.features_title')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded border bg-white/70">{t('home.features.v1')}</div>
            <div className="p-4 rounded border bg-white/70">{t('home.features.v2')}</div>
            <div className="p-4 rounded border bg-white/70">{t('home.features.v3')}</div>
            <div className="p-4 rounded border bg-white/70">{t('home.features.v4')}</div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold">{t('home.how_title')}</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-2 text-slate-700">
            <li className="p-4 rounded border bg-white">{t('home.how_steps.s1')}</li>
            <li className="p-4 rounded border bg-white">{t('home.how_steps.s2')}</li>
            <li className="p-4 rounded border bg-white">{t('home.how_steps.s3')}</li>
            <li className="p-4 rounded border bg-white">{t('home.how_steps.s4')}</li>
          </ol>
          <div className="mt-6">
            <a href="/search" className="px-4 py-2 border rounded-md">{t('common.learn_more')}</a>
          </div>
        </div>
      </section>
    </main>
  )
}
