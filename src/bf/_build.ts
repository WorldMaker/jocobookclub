import { JSDOM } from 'jsdom'
import esbuild from 'esbuild'
import { denoPlugins } from '@luca/esbuild-deno-loader'

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: [
    { out: 'ballot-page', in: './pages/ballot.ts' },
    { out: 'book-page', in: './pages/book.ts' },
    { out: 'final-tally', in: './final-tally/main.tsx' },
    { out: 'invite-register', in: './invite-register/main.tsx' },
    {
      out: 'login-button',
      in: './login-button/main.tsx',
    },
    { out: 'login-form', in: './login-form/main.tsx' },
    { out: 'passkey-page', in: './pages/passkey.ts' },
    { out: 'suggestions-page', in: './pages/suggestions.ts' },
  ],
  outdir: '../site/bf/',
  bundle: true,
  splitting: true,
  target: 'es2022',
  platform: 'browser',
  format: 'esm',
  jsxFactory: 'jsx',
  jsxFragment: 'Fragment',
})

// *** Stamps ***

const { window } = new JSDOM()
const { customElements, document, HTMLElement } = window
globalThis.customElements = customElements
globalThis.HTMLElement = HTMLElement

const { buildBallotStamps } = await import('./pages/_ballot-stamps.ts')
await buildBallotStamps(document)

const { buildBookStamps } = await import('./pages/_book-stamps.ts')
await buildBookStamps(document)

const { buildInviteStamps } = await import('./_invite-register-stamps.ts')
await buildInviteStamps(document)

const { buildLoginStamps } = await import('./_login-form-stamps.ts')
await buildLoginStamps(document)

const { buildPasskeyStamps } = await import('./pages/_passkey-stamps.ts')
await buildPasskeyStamps(document)

const { buildSuggestionStamps } = await import('./pages/_suggestions-stamps.ts')
await buildSuggestionStamps(document)
