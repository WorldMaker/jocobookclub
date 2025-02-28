import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminApp from './admin.ts'
import inviteApp from './invite.ts'
import type { KvProvidedVariables } from './kv.ts'
import loginApp from './login.ts'
import { listenQueue } from './queue.ts'
import suggestionApp from './suggestion.ts'
import userApp from './user.ts'

const kv = await Deno.openKv()
kv.listenQueue((msg) => listenQueue(kv, msg))

const app = new Hono<{ Variables: KvProvidedVariables }>()
  .use(async (c, next) => {
    c.set('kv', kv)
    await next()
  })
  .use(cors({
    origin: ['https://worldmaker.net', 'http://localhost:3000'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }))
  .route('/admin', adminApp)
  .route('/invite', inviteApp)
  .route('/login', loginApp)
  .route('/suggestion', suggestionApp)
  .route('/user', userApp)

Deno.serve(app.fetch)

export default app
