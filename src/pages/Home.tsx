import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              {t('home.hero_title')}
            </h1>
            <p className="mt-4 text-slate-600 text-lg md:text-xl">
              {t('home.hero_subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/search"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                {t('home.cta_find_teacher')}
              </a>
              <a
                href="/register?role=teacher"
                className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-5 py-3 text-emerald-800 hover:bg-emerald-50"
              >
                {t('home.cta_register_teacher')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.features_title')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="text-2xl">✅</div>
              <div className="mt-2 font-medium text-slate-900">{t('home.features.v1')}</div>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="text-2xl">⚡</div>
              <div className="mt-2 font-medium text-slate-900">{t('home.features.v2')}</div>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="text-2xl">💬</div>
              <div className="mt-2 font-medium text-slate-900">{t('home.features.v3')}</div>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="text-2xl">⏱️</div>
              <div className="mt-2 font-medium text-slate-900">{t('home.features.v4')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.how_title')}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 text-slate-700">
            <li className="rounded-xl border bg-white p-4">{t('home.how_steps.s1')}</li>
            <li className="rounded-xl border bg-white p-4">{t('home.how_steps.s2')}</li>
            <li className="rounded-xl border bg-white p-4">{t('home.how_steps.s3')}</li>
            <li className="rounded-xl border bg-white p-4">{t('home.how_steps.s4')}</li>
          </ol>
          <div className="mt-6">
            <a href="/search" className="inline-flex items-center rounded-md border px-5 py-3 hover:bg-white">
              {t('common.learn_more')}
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.categories_title')}</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c1')}</span>
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c2')}</span>
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c3')}</span>
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c4')}</span>
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c5')}</span>
            <span className="inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{t('home.categories.c6')}</span>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.testimonials_title')}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <figure className="rounded-2xl border bg-white p-5 shadow-sm">
              <blockquote className="text-slate-700">“{t('home.testimonials.t1_text')}”</blockquote>
              <figcaption className="mt-3 text-xs text-slate-500">{t('home.testimonials.t1_author')}</figcaption>
            </figure>
            <figure className="rounded-2xl border bg-white p-5 shadow-sm">
              <blockquote className="text-slate-700">“{t('home.testimonials.t2_text')}”</blockquote>
              <figcaption className="mt-3 text-xs text-slate-500">{t('home.testimonials.t2_author')}</figcaption>
            </figure>
            <figure className="rounded-2xl border bg-white p-5 shadow-sm">
              <blockquote className="text-slate-700">“{t('home.testimonials.t3_text')}”</blockquote>
              <figcaption className="mt-3 text-xs text-slate-500">{t('home.testimonials.t3_author')}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.stats_title')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-extrabold text-slate-900">150+</div>
              <div className="mt-1 text-sm text-slate-600">{t('home.stats.s1_label')}</div>
            </div>
            <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-extrabold text-slate-900">1,200+</div>
              <div className="mt-1 text-sm text-slate-600">{t('home.stats.s2_label')}</div>
            </div>
            <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-extrabold text-slate-900">98%</div>
              <div className="mt-1 text-sm text-slate-600">{t('home.stats.s3_label')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('home.faq_title')}</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
            <details className="group border-b p-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                <span>{t('home.faq.q1')}</span>
                <span className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{t('home.faq.a1')}</p>
            </details>
            <details className="group border-b p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                <span>{t('home.faq.q2')}</span>
                <span className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{t('home.faq.a2')}</p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                <span>{t('home.faq.q3')}</span>
                <span className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{t('home.faq.a3')}</p>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}

