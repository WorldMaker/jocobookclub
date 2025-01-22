import esbuild from 'esbuild'
import { denoPlugins } from '@luca/esbuild-deno-loader'

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: [
    { out: 'dolphin-rating', in: './dolphin-rating/main.tsx' },
    { out: 'invite-register', in: './invite-register/main.tsx' },
    {
      out: 'login-button',
      in: './login-button/main.tsx',
    },
    { out: 'login-form', in: './login-form/main.tsx' },
    { out: 'passkey-page', in: './pages/passkey.ts' },
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
