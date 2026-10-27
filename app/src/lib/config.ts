// Sign-in is built but switched off for now. While it is off, the app signs in
// anonymously so progress still belongs to a real (anonymous) Supabase user.
export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true'
