import * as z from 'zod'
import { UserId } from './user.ts'

export const Mark = z.enum([
  'alicorn',
  'cat-space',
  'lobster',
  'otter',
  'raccoon',
  'squirrel',
])

export type Mark = z.infer<typeof Mark>

export const BookMarks = z.partialRecord(
  Mark,
  z.partialRecord(UserId, z.coerce.date()),
)

export type BookMarks = z.infer<typeof BookMarks>
