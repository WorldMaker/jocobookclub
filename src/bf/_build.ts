import { JSDOM } from 'jsdom'
import esbuild from 'esbuild'
import { denoPlugins } from '@luca/esbuild-deno-loader'

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: [
    { out: 'ballot-page', in: './pages/ballot.ts' },
    { out: 'book-page', in: './pages/book.ts' },
    { out: 'final-tally', in: './pages/final-tally.ts' },
    { out: 'invite-register', in: './invite-register/main.tsx' },
    { out: 'local-time', in: './local-time.ts' },
    { out: 'login-form', in: './login-form/main.tsx' },
    { out: 'nav-menu', in: './nav-menu.ts' },
    { out: 'passkey-page', in: './pages/passkey.ts' },
    { out: 'suggestions-page', in: './pages/suggestions.ts' },
    { out: 'tag-page', in: './pages/tag.ts' },
  ],
  outdir: '../site/bf/',
  metafile: true,
  logLevel: 'info',
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

console.info('Building ballot stamps...')
const { buildBallotStamps } = await import('./pages/_ballot-stamps.ts')
await buildBallotStamps(document)

console.info('Building book stamps...')
const { buildBookStamps } = await import('./pages/_book-stamps.ts')
await buildBookStamps(document)

console.info('Building invite stamps...')
const { buildInviteStamps } = await import('./_invite-register-stamps.ts')
await buildInviteStamps(document)

console.info('Building login stamps...')
const { buildLoginStamps } = await import('./_login-form-stamps.ts')
await buildLoginStamps(document)

console.info('Building passkey stamps...')
const { buildPasskeyStamps } = await import('./pages/_passkey-stamps.ts')
await buildPasskeyStamps(document)

console.info('Building suggestion stamps...')
const { buildSuggestionStamps } = await import('./pages/_suggestions-stamps.ts')
await buildSuggestionStamps(document)

console.info('Building tag page stamps...')
const { buildTagPageStamps } = await import('./pages/_tag-stamps.ts')
await buildTagPageStamps(document)
