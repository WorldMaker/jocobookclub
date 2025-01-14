import { Hono } from 'hono'
import inviteApp from './invite.ts'
import loginApp from './login.ts'
import userApp from './user.ts'
import { KvProvidedVariables } from './kv.ts'

const kv = await Deno.openKv()

const app = new Hono<{ Variables: KvProvidedVariables }>()
  .use(async (c, next) => {
    c.set('kv', kv)
    await next()
  })
  .route('/invite', inviteApp)
  .route('/login', loginApp)
  .route('/user', userApp)

Deno.serve(app.fetch)
 