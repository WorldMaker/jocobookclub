import * as z from 'zod'

export const Mark = z.enum([
  'alicorn',
  'cat-space',
  'lobster',
  'otter',
  'raccoon',
  'squirrel',
])

export type Mark = z.infer<typeof Mark>
