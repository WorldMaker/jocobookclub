import { Hono } from 'hono'
import inviteApp from './invite.ts'
import loginApp from './login.ts'
import userApp from './user.ts'
import { KvProvidedVariables } from './kv.ts'
import { listenQueue } from './queue.ts'

const kv = await Deno.openKv()
kv.listenQueue((msg) => listenQueue(kv, msg))

const app = new Hono<{ Variables: KvProvidedVariables }>()
  .use(async (c, next) => {
    c.set('kv', kv)
    await next()
  })
  .route('/invite', inviteApp)
  .route('/login', loginApp)
  .route('/user', userApp)

Deno.serve(app.fetch)
