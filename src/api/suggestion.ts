import { Hono } from 'hono'
import type { KvProvidedVariables } from './kv.ts'
import type { Session } from './models/session.ts'
import {
  deleteSuggestion,
  getSuggestion,
  listSuggestions,
  Suggestion,
  updateSuggestion,
} from './models/suggestion.ts'
import { zValidator } from '@hono/zod-validator'

interface Variables extends KvProvidedVariables {
  session: Session
}

const app = new Hono<{ Variables: Variables }>()
  .get('/:id', async (c) => {
    const kv = c.get('kv')
    const id = c.req.param('id')
    const suggestion = await getSuggestion(kv, id)
    if (!suggestion || !suggestion.success) {
      return c.json({ error: 'Suggestion not found' }, 404)
    }
    return c.json(suggestion.data)
  })
  .put('/:id', zValidator('json', Suggestion), async (c) => {
    const kv = c.get('kv')
    const id = c.req.param('id')
    const suggestion = c.req.valid('json')
    if (suggestion.id !== id) {
      return c.json({ error: 'Suggestion IDs do not match' }, 400)
    }
    const existingSuggestion = await getSuggestion(kv, id)
    const session = c.get('session')
    if (
      existingSuggestion && existingSuggestion.success &&
      (existingSuggestion.data.userId !== session.userId || !session.admin)
    ) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    const updatedSuggestion = {
      ...suggestion,
      updated: new Date().toISOString(),
    }
    await updateSuggestion(kv, updatedSuggestion)
    return c.json(updatedSuggestion, 200)
  })
  .delete('/:id', async (c) => {
    const kv = c.get('kv')
    const id = c.req.param('id')
    const existingSuggestion = await getSuggestion(kv, id)
    if (!existingSuggestion || !existingSuggestion.success) {
      return c.json({ error: 'Suggestion not found' }, 404)
    }
    const session = c.get('session')
    if (existingSuggestion.data.userId !== session.userId || !session.admin) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    await deleteSuggestion(kv, id)
    return c.body(null, 204)
  })
  .get('/', async (c) => {
    const kv = c.get('kv')
    const suggestions = await listSuggestions(kv)
    return c.json({ suggestions })
  })
  .post('/', zValidator('json', Suggestion), async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const suggestion = c.req.valid('json')
    const existingSuggestion = await getSuggestion(kv, suggestion.id)
    if (existingSuggestion) {
      return c.json({ error: 'Suggestion already exists' }, 409)
    }
    const newSuggestion = {
      ...suggestion,
      userId: session.userId,
      updated: new Date().toISOString(),
    }
    await updateSuggestion(kv, newSuggestion)
    return c.json(newSuggestion, 201, {
      Location: new URL(
        `${suggestion.id}`,
        c.req.url.endsWith('/') ? c.req.url : `${c.req.url}/`,
      ).toString(),
    })
  })

export default app
