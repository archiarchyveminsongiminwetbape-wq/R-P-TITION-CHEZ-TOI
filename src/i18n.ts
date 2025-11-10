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
      categories_title: 'Matières populaires',
      categories: { c1: 'Mathématiques', c2: 'Français', c3: 'Anglais', c4: 'Physique', c5: 'Chimie', c6: 'SVT' },
      testimonials_title: 'Ils nous font confiance',
      testimonials: {
        t1_text: 'Grâce à la plateforme, nous avons trouvé un professeur patient et pédagogue pour notre fils.',
        t1_author: 'Mireille, parent',
        t2_text: 'Les réservations sont simples et je gère mes disponibilités en un clic.',
        t2_author: 'Jean, professeur',
        t3_text: 'Service fiable, profs vérifiés et réactifs. Je recommande !',
        t3_author: 'Paul, parent',
      },
      stats_title: 'Quelques chiffres',
      stats: { s1_label: 'Professeurs inscrits', s2_label: 'Réservations', s3_label: 'Taux de satisfaction' },
      faq_title: 'FAQ',
      faq: {
        q1: 'Comment se passe le paiement ?',
        a1: 'Le paiement se fait directement avec le professeur. La plateforme met en relation et facilite la réservation.',
        q2: 'Les professeurs sont-ils vérifiés ?',
        a2: 'Oui, nous vérifions l’identité et l’expérience des professeurs avant validation.',
        q3: 'Puis-je changer de professeur ?',
        a3: 'Oui, vous pouvez réserver un autre professeur à tout moment selon vos besoins.'
      }
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
      categories_title: 'Popular subjects',
      categories: { c1: 'Maths', c2: 'French', c3: 'English', c4: 'Physics', c5: 'Chemistry', c6: 'Biology' },
      testimonials_title: 'Trusted by families and teachers',
      testimonials: {
        t1_text: 'We found a patient, effective teacher for our son, quickly.',
        t1_author: 'Mireille, parent',
        t2_text: 'Bookings are simple and I manage availability in one click.',
        t2_author: 'Jean, teacher',
        t3_text: 'Reliable service with verified, responsive teachers. Recommended!',
        t3_author: 'Paul, parent',
      },
      stats_title: 'At a glance',
      stats: { s1_label: 'Registered teachers', s2_label: 'Bookings', s3_label: 'Satisfaction rate' },
      faq_title: 'FAQ',
      faq: {
        q1: 'How does payment work?',
        a1: 'Payment is handled directly with the teacher. The platform connects you and simplifies booking.',
        q2: 'Are teachers verified?',
        a2: 'Yes, we verify identity and experience before approval.',
        q3: 'Can I change teachers?',
        a3: 'Yes, you can book a different teacher anytime to fit your needs.'
      }
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
