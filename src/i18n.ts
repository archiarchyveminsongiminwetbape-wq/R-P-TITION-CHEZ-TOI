import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  fr: { translation: { title: 'Répétition chez toi', subtitle: 'Mise en relation Parents ↔ Professeurs à Douala', cta: 'Commencer' } },
  en: { translation: { title: 'Tutoring at your home', subtitle: 'Connecting Parents ↔ Teachers in Douala', cta: 'Get started' } },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n
