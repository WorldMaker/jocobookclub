import * as z from 'zod'
import { Ballot } from './ballot.ts'
import { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'
import { BookMarks, Mark } from './mark.ts'
import type { Preferred } from './preferred.ts'

export const EligibleBooks = z.array(z.string())

export type EligibleBooks = z.infer<typeof EligibleBooks>

// Allowed percentage of books at Rank 1 for a ballot to be counted, to
// encourage people to rank more books
const SupportThreshold = 0.5

/**
 * A tally of 0 or more ballots for a specific list of eligible books
 *
 * This is an adjacency matrix of pairwise comparisons of books
 *
 * It is considered internal to the voting process and compatibility
 * is not guaranteed across versions
 */
export const Tally = z.object({
  count: z.number().int().gte(0),
  mehCount: z.number().int().gte(0),
  supportThreshold: z.number().positive().lte(1),
  uncounted: z.number().int().gte(0),
  updated: z.coerce.date(),
  ballotDates: z.record(z.iso.date(), z.number().int().gte(0)),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
  marks: z.array(BookMarks),
  supports: z.array(z.number().int().gte(0)),
  preferredMultiplier: z.number().int().gte(1),
  preferred: z.set(UserId),
})

export type Tally = z.infer<typeof Tally>

export function zeroTally(books: EligibleBooks, preferred: Preferred): Tally {
  return {
    count: 0,
    mehCount: 0,
    uncounted: 0,
    supportThreshold: SupportThreshold,
    updated: new Date(),
    ballotDates: {},
    books,
    matrix: books.map(() => books.map(() => 0)),
    marks: books.map(() => ({})),
    supports: books.map(() => 0),
    preferredMultiplier: preferred.multiplier,
    preferred: new Set(),
  }
}

export function getTallyFromBallot(
  books: EligibleBooks,
  ballot: Ballot,
  preferred: Preferred,
  supportThreshold = SupportThreshold,
): Tally {
  const tally = zeroTally(books, preferred)
  if (!ballot.active) {
    return {
      ...tally,
      uncounted: 1,
    }
  }
  const ballotDate = ballot.updated.toTemporalInstant().toZonedDateTimeISO(
    'America/New_York',
  ).toPlainDate().toString()
  tally.ballotDates[ballotDate] = (tally.ballotDates[ballotDate] ?? 0) + 1
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
    const votes1 = typeof book1State === 'number'
      ? book1State
      : book1State?.rank ?? 1
    addBookToRank(votes1, i)
    const mark = typeof book1State === 'number' ? undefined : book1State?.mark
    if (mark) {
      tally.marks[i][mark[0]] = { [ballot.userId]: mark[1] }
    }
    for (let j = i + 1; j < books.length; j++) {
      const book2 = books[j]
      const book2State = ballot.books[book2]
      const votes2 = typeof book2State === 'number'
        ? book2State
        : book2State?.rank ?? 1
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

  const oneRanked = booksByRank.get(1)?.size ?? 0
  const percentOneRanked = oneRanked / books.length
  if (percentOneRanked >= supportThreshold) {
    return {
      ...zeroTally(books, preferred),
      uncounted: 1,
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

export function addTally(
  tally1: Tally,
  tally2: Tally,
  preferred: Preferred,
): Tally {
  if (tally2.count === 0 && tally2.uncounted === 0) {
    return tally1
  }
  if (tally1.books.length !== tally2.books.length) {
    throw new TallyBooksMismatchError('Books length mismatch')
  }
  if (tally1.supportThreshold !== tally2.supportThreshold) {
    throw new TallyBooksMismatchError('Support threshold mismatch')
  }
  if (
    tally1.preferredMultiplier !== tally2.preferredMultiplier ||
    tally2.preferredMultiplier !== preferred.multiplier
  ) {
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
    uncounted: tally1.uncounted + tally2.uncounted,
    updated: new Date(),
    ballotDates: [
      ...new Set([
        ...Object.keys(tally1.ballotDates),
        ...Object.keys(tally2.ballotDates),
      ]),
    ].reduce((acc, date) => {
      acc[date] = (tally1.ballotDates[date] ?? 0) +
        (tally2.ballotDates[date] ?? 0)
      return acc
    }, {} as Record<string, number>),
    books: tally1.books,
    matrix,
    marks: tally1.books.map((_book, i) => {
      const newRow: BookMarks = {}
      for (const mark of Mark.options) {
        const mark1 = tally1.marks[i][mark]
        const mark2 = tally2.marks[i][mark]
        if (mark1 || mark2) {
          newRow[mark] = {
            ...mark1,
            ...mark2,
          }
        }
      }
      return newRow
    }),
    supports: tally1.supports.map((value, i) => value + tally2.supports[i]),
    preferredMultiplier: tally1.preferredMultiplier,
    preferred: new Set([...tally1.preferred, ...tally2.preferred]),
    supportThreshold: tally1.supportThreshold,
  }
}

export const RecentWindow = z.enum({ unknown: 0, last2Months: 1 })

export type RecentWindow = z.infer<typeof RecentWindow>

export function getRecentWindowDescription(window?: RecentWindow) {
  switch (window) {
    case RecentWindow.enum.last2Months:
      return 'last 2 months'
    case RecentWindow.enum.unknown:
    default:
      return 'unknown'
  }
}

export const TallyUserMarks = z.partialRecord(UserId, z.coerce.date())

export type TallyUserMarks = z.infer<typeof TallyUserMarks>

export const TallyBookMarks = z.partialRecord(Mark, TallyUserMarks)

export type TallyBookMarks = z.infer<typeof TallyBookMarks>

/**
 * The final tally is a "widest path" matrix, and a chosen winner
 *
 * It is considered the final output of the voting process and should be compatible across versions
 * (for instance, it is dumped to JSON and stored/built by the static site for history pages)
 */
export const FinalTally = z.object({
  count: z.number().int().gte(0),
  mehCount: z.number().int().gte(0).optional(),
  uncounted: z.number().int().gte(0).optional(),
  updated: z.coerce.date(),
  oldest: z.coerce.date().optional(),
  recentCount: z.number().int().gte(0).optional(),
  recentWindow: RecentWindow.optional(),
  books: EligibleBooks,
  matrix: z.array(z.array(z.number().int().gte(0))),
  marks: z.array(TallyBookMarks).optional(),
  supports: z.array(z.number().int().gte(0)).optional(),
  preferredMultiplier: z.number().int().gte(1).optional(),
  preferred: z.array(UserId).optional(),
  ranking: z.array(z.string()),
  supportThreshold: z.number().positive().lte(1).optional(),
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

  const twoMonthsAgo = Temporal.Now.plainDateISO().subtract({ months: 2 })
  const ballotDateStats = Object.entries(tally.ballotDates).reduce(
    (acc, [date, count]) => {
      const ballotDate = Temporal.PlainDate.from(date)
      if (Temporal.PlainDate.compare(ballotDate, acc.oldest) < 0) {
        acc.oldest = ballotDate
      }
      if (Temporal.PlainDate.compare(ballotDate, twoMonthsAgo) >= 0) {
        acc.recentCount += count
      }
      return acc
    },
    { recentCount: 0, oldest: Temporal.Now.plainDateISO() },
  )

  return {
    count: tally.count,
    mehCount: tally.mehCount,
    uncounted: tally.uncounted,
    updated: tally.updated,
    oldest: new Date(
      ballotDateStats.oldest.toZonedDateTime('America/New_York')
        .epochMilliseconds,
    ),
    recentCount: ballotDateStats.recentCount,
    recentWindow: RecentWindow.enum.last2Months,
    books,
    matrix,
    marks: tally.marks,
    supports: tally.supports,
    preferredMultiplier: tally.preferredMultiplier,
    preferred: Array.from(tally.preferred.values()),
    ranking,
    supportThreshold: tally.supportThreshold,
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
  if (maybeTally.versionstamp === null) {
    return Tally.safeParse(zeroTally([], { multiplier: 1, userIds: new Set() }))
  }
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
  let tally = zeroTally(books, preferred)
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
