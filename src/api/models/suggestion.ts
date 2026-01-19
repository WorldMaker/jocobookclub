import * as z from 'zod'
import { UserId } from './user.ts'

export const Suggestion = z.object({
  id: z.ulid(),
  userId: UserId,
  ltid: z.string().optional(),
  olid: z.string().optional(),
  tsgid: z.string().optional(),
  title: z.string().nonempty(),
  author: z.string().nonempty(),
  whyBlurb: z.string().nonempty(),
  cw: z.string().optional(),
  tags: z.array(z.string()).optional(),
  updated: z.iso.datetime({ offset: true }),
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
