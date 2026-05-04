import * as z from 'zod'
import { Ballot } from './ballot.ts'
import { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'
import { Mark } from './mark.ts'
import type { Preferred } from './preferred.ts'

export const EligibleBooks = z.array(z.string())

export type EligibleBooks = z.infer<typeof EligibleBooks>

/**
 * A tally of 0 or more ballots for a specific list of eligible books
 *
 * This is an adjacency matrix of pairwise comparisons of books
 */
export const Tally = z.object({
  count: z.number().int().gte(0),
  mehCount: z.number().int().gte(0),
  updated: z.coerce.date(),
  oldest: z.coerce.date(),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
  marks: z.array(z.array(z.tuple([UserId, Mark, z.coerce.date()]))),
  supports: z.array(z.number().int().gte(0)),
  preferredMultiplier: z.number().int().gte(1),
  preferred: z.set(UserId),
})

export type Tally = z.infer<typeof Tally>

export function zeroTally(books: EligibleBooks): Tally {
  return {
    count: 0,
    mehCount: 0,
    updated: new Date(),
    oldest: new Date(),
    books,
    matrix: books.map(() => books.map(() => 0)),
    marks: books.map(() => []),
    supports: books.map(() => 0),
    preferredMultiplier: 1,
    preferred: new Set(),
  }
}

export function getTallyFromBallot(
  books: EligibleBooks,
  ballot: Ballot,
  preferred: Preferred,
): Tally {
  const tally = zeroTally(books)
  if (!ballot.active) {
    return tally
  }
  tally.oldest = ballot.updated
  tally.preferredMultiplier = preferred.multiplier
  const isPreferred = preferred.userIds.has(ballot.userId)  
  const voteStrength = isPreferred ? preferred.multiplier : 1
  tally.count = voteStrength
  if (isPreferred) {
    tally.preferred.add(ballot.userId)
  }
  const booksByRank = new Map<number, Set<number>>()
  function addBookToRank(rank: number, bookIndex: number) {
    if (!booksByRank.has(rank)) {
      booksByRank.set(rank, new Set())
    }
    booksByRank.get(rank)!.add(bookIndex)
  }
  for (let i = 0; i < books.length; i++) {
    const book1 = books[i]
    const book1State = ballot.books[book1]
    const votes1 = typeof book1State === 'number' ? book1State : book1State?.vote ?? 1
    addBookToRank(votes1, i)
    const mark = typeof book1State === 'number' ? undefined : book1State?.mark
    if (mark) {
      tally.marks[i].push([ballot.userId, mark[0], mark[1]])
    }
    for (let j = i + 1; j < books.length; j++) {
      const book2 = books[j]
      const book2State = ballot.books[book2]
      const votes2 = typeof book2State === 'number' ? book2State : book2State?.vote ?? 1
      if (votes1 > votes2) {
        tally.matrix[i][j] = voteStrength
      } else if (votes2 > votes1) {
        tally.matrix[j][i] = voteStrength
      }
    }
  }
  if (booksByRank.size === 1) {
    tally.mehCount = voteStrength
  } else {
    const supportRanks = Array.from(booksByRank.keys()).sort().slice(1) // all but the lowest rank
    for (const rank of supportRanks) {
      for (const bookIndex of booksByRank.get(rank)!) {
        tally.supports[bookIndex] = voteStrength
      }
    }
  }
  return tally
}

export class TallyBooksMismatchError extends Error {
  constructor(msg: string) {
    super(`Tally books mismatch: ${msg}`)
    this.name = 'TallyBooksMismatchError'
  }
}

export function addTally(tally1: Tally, tally2: Tally, preferred: Preferred): Tally {
  if (tally1.books.length !== tally2.books.length) {
    throw new TallyBooksMismatchError('Books length mismatch')
  }
  if (tally1.preferredMultiplier !== tally2.preferredMultiplier || tally2.preferredMultiplier !== preferred.multiplier) {
    throw new TallyBooksMismatchError('Preferred multiplier mismatch')
  }
  if (!tally2.preferred.isSubsetOf(preferred.userIds)) {
    throw new TallyBooksMismatchError('Preferred mismatch')
  }
  for (let i = 0; i < tally1.books.length; i++) {
    if (tally1.books[i] !== tally2.books[i]) {
      throw new TallyBooksMismatchError('Books order mismatch')
    }
  }
  const matrix = tally1.matrix.map((row, i) =>
    row.map((value, j) => value + tally2.matrix[i][j])
  )
  return {
    count: tally1.count + tally2.count,
    mehCount: tally1.mehCount + tally2.mehCount,
    updated: new Date(),
    oldest: new Date(Math.min(tally1.oldest.getTime(), tally2.oldest.getTime())),
    books: tally1.books,
    matrix,
    marks: tally1.marks.map((row, i) =>
      [...row, ...tally2.marks[i]]
    ),
    supports: tally1.supports.map((value, i) => value + tally2.supports[i]),
    preferredMultiplier: tally1.preferredMultiplier,
    preferred: new Set([...tally1.preferred, ...tally2.preferred]),
  }
}

/*
 * The final tally is a "widest path" matrix, and a chosen winner
 */
export const FinalTally = z.object({
  count: z.number().int().gte(0),
  mehCount: z.number().int().gte(0).optional(),
  updated: z.coerce.date(),
  oldest: z.coerce.date().optional(),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
  marks: z.array(z.array(z.tuple([UserId, Mark, z.coerce.date()]))).optional(),
  supports: z.array(z.number().int().gte(0)).optional(),
  preferredMultiplier: z.number().int().gte(1).optional(),
  preferred: z.set(UserId).optional(),
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
    mehCount: tally.mehCount,
    updated: tally.updated,
    oldest: tally.oldest,
    books,
    matrix,
    marks: tally.marks,
    supports: tally.supports,
    preferredMultiplier: tally.preferredMultiplier,
    preferred: tally.preferred,
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
  preferred: Preferred,
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
    const userTally = getTallyFromBallot(tally.books, ballot.data, preferred)
    tally = addTally(tally, userTally, preferred)
  }
  return tally
}

export async function getFinalTally(kv: Deno.Kv) {
  const maybeFinalTally = await kv.get(['final-tally'])
  return FinalTally.safeParse(maybeFinalTally.value)
}
