import esbuild from 'esbuild'
import { denoPlugins } from '@luca/esbuild-deno-loader'

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ['./invite-register/main.tsx'],
  outfile: '../site/bf/invite-register.js',
  bundle: true,
  target: 'es2022',
  platform: 'browser',
  format: 'esm',
  jsxFactory: 'jsx',
  jsxFragment: 'Fragment',
})
