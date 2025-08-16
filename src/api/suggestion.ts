import { Hono } from 'hono'
import {
  deleteSuggestion,
  getSuggestion,
  listSuggestions,
  Suggestion,
  updateSuggestion,
} from './models/suggestion.ts'
import { zValidator } from '@hono/zod-validator'
import { sessionToken, type SessionVariables } from './session-token.ts'

const app = new Hono<{ Variables: SessionVariables }>()
  .use(sessionToken)
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
    const session = c.get('session')
    if (suggestion.userId !== session.userId && !session.admin) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    const existingSuggestion = await getSuggestion(kv, id)
    if (existingSuggestion && existingSuggestion.success && existingSuggestion.data.userId !== session.userId && !session.admin) {
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
    if (existingSuggestion.data.userId !== session.userId && !session.admin) {
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

export default app
