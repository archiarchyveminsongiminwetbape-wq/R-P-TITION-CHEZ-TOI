import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  fr: { translation: {
    title: 'Répétition chez toi',
    subtitle: 'Mise en relation Parents ↔ Professeurs à Douala',
    cta: 'Commencer',
    site: { name: 'Répétition chez toi' },
    home: {
      hero_title: 'Des professeurs qualifiés, chez vous à Douala',
      hero_subtitle: 'Trouvez le professeur idéal pour votre enfant, en quelques clics.',
      cta_find_teacher: 'Trouver un professeur',
      cta_register_teacher: 'Devenir professeur',
      features_title: 'Pourquoi nous choisir ?',
      features: { v1: 'Professeurs vérifiés', v2: 'Réservations simples et rapides', v3: 'Messagerie intégrée', v4: 'Paiement à l’heure (à discuter)' },
      how_title: 'Comment ça marche ?',
      how_steps: { s1: '1. Recherchez par matière, niveau, quartier', s2: '2. Consultez le profil du professeur', s3: '3. Réservez un créneau selon ses disponibilités', s4: '4. Discutez par messagerie et confirmez' },
    },
    common: { learn_more: 'En savoir plus' },
    toast: { saved: 'Enregistré avec succès', booking_ok: 'Réservation créée', login_ok: 'Connexion réussie', register_ok: 'Compte créé', error: 'Une erreur est survenue' },
  } },
  en: { translation: {
    title: 'Tutoring at your home',
    subtitle: 'Connecting Parents ↔ Teachers in Douala',
    cta: 'Get started',
    site: { name: 'Tutoring at your home' },
    home: {
      hero_title: 'Qualified teachers, at your home in Douala',
      hero_subtitle: 'Find the right teacher for your child in a few clicks.',
      cta_find_teacher: 'Find a teacher',
      cta_register_teacher: 'Become a teacher',
      features_title: 'Why choose us?',
      features: { v1: 'Verified teachers', v2: 'Fast, simple bookings', v3: 'Built-in messaging', v4: 'Hourly payment (to discuss)' },
      how_title: 'How it works',
      how_steps: { s1: '1. Search by subject, level, neighborhood', s2: '2. View teacher profiles', s3: '3. Book a slot from availabilities', s4: '4. Chat and confirm' },
    },
    common: { learn_more: 'Learn more' },
    toast: { saved: 'Saved successfully', booking_ok: 'Booking created', login_ok: 'Logged in', register_ok: 'Account created', error: 'An error occurred' },
  } },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n
