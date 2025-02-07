import { z } from 'zod'
import { UserId } from './user.ts'

export const Suggestion = z.object({
  id: z.string().ulid(),
  userId: UserId,
  ltid: z.string().optional(),
  title: z.string(),
  author: z.string(),
  whyBlurb: z.string(),
  cw: z.string().optional(),
  updated: z.string().datetime({ offset: true }),
})
export type Suggestion = z.infer<typeof Suggestion>

export async function getSuggestion(kv: Deno.Kv, id: string) {
  const maybeSuggestion = await kv.get(['suggestion', id])
  const suggestion = Suggestion.safeParse(maybeSuggestion.value)
  return suggestion
}

export function updateSuggestion(kv: Deno.Kv, suggestion: Suggestion) {
  return kv.set(['suggestion', suggestion.id], Suggestion.parse(suggestion))
}

export async function listSuggestions(kv: Deno.Kv) {
  const suggestions = []
  for await (const maybeSuggestion of kv.list({ prefix: ['suggestion'] })) {
    const suggestion = Suggestion.safeParse(maybeSuggestion.value)
    if (!suggestion.success) {
      continue
    }
    suggestions.push(suggestion.data)
  }
  return suggestions
}

export function deleteSuggestion(kv: Deno.Kv, id: string) {
  return kv.delete(['suggestion', id])
}
