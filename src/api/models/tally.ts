import { z } from 'zod'
import { Ballot } from './ballot.ts'
import type { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'

export const EligibleBooks = z.array(z.string())

export type EligibleBooks = z.infer<typeof EligibleBooks>

/**
 * A tally of 0 or more ballots for a specific list of eligible books
 *
 * This is an adjacency matrix of pairwise comparisons of books
 */
export const Tally = z.object({
  count: z.number().int().gte(0),
  updated: z.string().datetime({ offset: true }),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
})

export type Tally = z.infer<typeof Tally>

export function zeroTally(books: EligibleBooks): Tally {
  return {
    count: 0,
    updated: new Date().toISOString(),
    books,
    matrix: books.map(() => books.map(() => 0)),
  }
}

export function getTallyFromBallot(
  books: EligibleBooks,
  ballot: Ballot,
): Tally {
  const tally = zeroTally(books)
  if (!ballot.active) {
    return tally
  }
  tally.count = 1
  for (let i = 0; i < books.length; i++) {
    for (let j = i + 1; j < books.length; j++) {
      const book1 = books[i]
      const book2 = books[j]
      const votes1 = ballot.books[book1] ?? 1
      const votes2 = ballot.books[book2] ?? 1
      if (votes1 > votes2) {
        tally.matrix[i][j] = 1
      } else if (votes2 > votes1) {
        tally.matrix[j][i] = 1
      }
    }
  }
  return tally
}

export function addTally(tally1: Tally, tally2: Tally): Tally {
  if (tally1.books.length !== tally2.books.length) {
    throw new Error('Tally books mismatch')
  }
  for (let i = 0; i < tally1.books.length; i++) {
    if (tally1.books[i] !== tally2.books[i]) {
      throw new Error('Tally books mismatch')
    }
  }
  const matrix = tally1.matrix.map((row, i) =>
    row.map((value, j) => value + tally2.matrix[i][j])
  )
  return {
    count: tally1.count + tally2.count,
    updated: new Date().toISOString(),
    books: tally1.books,
    matrix,
  }
}

/*
 * The final tally is a "widest path" matrix, and a chosen winner
 */
export const FinalTally = z.object({
  count: z.number().int().gte(0),
  updated: z.string().datetime({ offset: true }),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
  ranking: z.array(z.string()),
})

export type FinalTally = z.infer<typeof FinalTally>

export function tallyFinal(tally: Tally): FinalTally {
  const books = tally.books

  // Floyd-Warshall algorithm ("modified" for Schulze method)
  const matrix = tally.matrix.map((row) => Array.from(row).fill(0))

  for (let i = 0; i < books.length; i++) {
    for (let j = 0; j < books.length; j++) {
      if (i === j) {
        continue
      }
      if (tally.matrix[i][j] > tally.matrix[j][i]) {
        matrix[i][j] = tally.matrix[i][j]
      } else {
        matrix[i][j] = 0
      }
    }
  }

  for (let i = 0; i < books.length; i++) {
    for (let j = 0; j < books.length; j++) {
      if (i === j) {
        continue
      }
      for (let k = 0; k < books.length; k++) {
        if (i === k || j === k) {
          continue
        }
        matrix[j][k] = Math.max(
          matrix[j][k],
          Math.min(matrix[j][i], matrix[i][k]),
        )
      }
    }
  }

  // rank the p[i, j] matrix by number of "wins" for each book
  const wins = books.reduce((acc, book) => {
    acc[book] = 0
    return acc
  }, {} as Record<string, number>)
  for (let i = 0; i < books.length; i++) {
    for (let j = 0; j < books.length; j++) {
      if (i === j) {
        continue
      }
      if (matrix[i][j] > matrix[j][i]) {
        wins[books[i]]++
      }
    }
  }
  const ranking: string[] = Object.entries(wins)
    .sort(([, a], [, b]) => a - b)
    .map(([book]) => book)

  return {
    count: tally.count,
    updated: tally.updated,
    books,
    matrix,
    ranking,
  }
}

/**
 * Buckets for Tallies to avoid recomputing the entire set of ballots
 *
 * For now this resembles the Base 32 alphabet of ULID because 32 buckets seems
 * like a good scale. We could also use a smaller alphabet and a larger alphabet
 * depending on scale. We could also use multiple layers of tallies given the
 * simple map/reduce nature of them we could use some form of essentially a
 * binary tree of tallies.
 *
 * Buckets need to be in lexicographic order
 */
export const Bucket = z.enum(
  [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'J',
    'K',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ],
)

export type Bucket = z.infer<typeof Bucket>

export async function getTally(kv: Deno.Kv, bucket: Bucket) {
  const maybeTally = await kv.get(['tally', bucket])
  return Tally.safeParse(maybeTally.value)
}

export function getBucketForUser(userId: UserId) {
  return Bucket.options.find((bucket) => reverseUlid(userId).startsWith(bucket))
}

export async function tallyBucket(
  kv: Deno.Kv,
  bucket: Bucket,
  books: EligibleBooks,
) {
  const bucketIndex = Bucket.options.indexOf(bucket)
  let tally = zeroTally(books)
  for await (
    const maybeBallot of kv.list(
      bucketIndex + 1 === Bucket.options.length
        ? { prefix: ['ballot'], start: ['ballot', bucket] }
        : {
          start: ['ballot', bucket],
          end: ['ballot', Bucket.options[bucketIndex + 1]],
        },
    )
  ) {
    const ballot = Ballot.safeParse(maybeBallot.value)
    if (!ballot.success) {
      continue
    }
    const userTally = getTallyFromBallot(tally.books, ballot.data)
    tally = addTally(tally, userTally)
  }
  return tally
}

export async function tallyFinalRanking(kv: Deno.Kv, books: EligibleBooks) {
  let finalTally = zeroTally(books)
  for (const bucket of Bucket.options) {
    const tally = await getTally(kv, bucket)
    if (!tally.success) {
      continue
    }
    finalTally = addTally(finalTally, tally.data)
  }
  return tallyFinal(finalTally)
}

export async function getFinalTally(kv: Deno.Kv) {
  const maybeFinalTally = await kv.get(['final-tally'])
  return FinalTally.safeParse(maybeFinalTally.value)
}
