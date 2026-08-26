import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Operator details the privacy policy and terms are legally required to name.
 * A development build falls back to a visible placeholder; a production build
 * refuses, because shipping a policy that names nobody is worse than useless.
 */
const REQUIRED_LEGAL_ENV = [
  ['VITE_LEGAL_OPERATOR_NAME', 'who operates the service, e.g. "ИП Иванов И. И." or "Acme Ltd"'],
  ['VITE_LEGAL_OPERATOR_LOCATION', 'where they are established, e.g. "Serbia"'],
  ['VITE_LEGAL_CONTACT_EMAIL', 'an address that answers privacy mail, e.g. "privacy@yourdomain.com"'],
] as const

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = REQUIRED_LEGAL_ENV.filter(([key]) => !env[key] || env[key] === 'UNSET')
    if (missing.length) {
      throw new Error(
        'Refusing to build for production with unfilled legal operator details.\n' +
          missing.map(([key, hint]) => `  ${key} — ${hint}`).join('\n') +
          '\nSet them in the build environment (see app/DEPLOY.md), then build again.'
      )
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  }
})
