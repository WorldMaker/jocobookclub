import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminApp from './admin.ts'
import inviteApp from './invite.ts'
import type { KvProvidedVariables } from './kv.ts'
import loginApp from './login.ts'
import suggestionApp from './suggestion.ts'
import userApp from './user.ts'

const kv = await Deno.openKv()

const app = new Hono<{ Variables: KvProvidedVariables }>()
  .use(async (c, next) => {
    c.set('kv', kv)
    await next()
  })
  .use(
    cors({
      origin: ['https://worldmaker.net', 'https://jocobookclub.localhost'],
      allowHeaders: ['Authorization', 'Content-Type'],
    }),
  )
  .route('/admin', adminApp)
  .route('/invite', inviteApp)
  .route('/login', loginApp)
  .route('/suggestion', suggestionApp)
  .route('/user', userApp)

Deno.serve(app.fetch)

export default app
