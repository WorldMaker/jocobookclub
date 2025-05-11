import { parseArgs } from 'jsr:@std/cli'
import { Ballot } from '../src/api/models/ballot.ts'

// Calculate some stats about books in the ballot
// You will need to configure environment variables DENO_KV_ACCESS_TOKEN
// and CLUB_KV_URL

const hasKvAccess = Deno.env.has('DENO_KV_ACCESS_TOKEN')
const clubUrl = Deno.env.get('CLUB_KV_URL')

if (!hasKvAccess || !clubUrl) {
  console.log(
    'You need to set the DENO_KV_ACCESS_TOKEN and CLUB_KV_URL environment variables',
  )
  Deno.exit(1)
}

const args = parseArgs(Deno.args, {
  string: ['ltid'],
  collect: 'ltid',
})

const books = new Map(args.ltid.map((ltid) => [ltid as string, { high: 0, low: 0 }]))

if (books.size === 0) {
  console.error('You need to specify a list of LTIDs')
  Deno.exit(1)
}

const kv = await Deno.openKv(clubUrl)

for await (const maybeBallot of kv.list({ prefix: ['ballot'] })) {
  const ballot = Ballot.safeParse(maybeBallot.value)
  if (!ballot.success) {
    console.error('Invalid ballot', maybeBallot.key, ballot.error)
    continue
  }

  const ranks = Object.values(ballot.data.books)
    .reduce((acc, cur) => ({ min: Math.min(acc.min, cur), max: Math.max(acc.max, cur )}), { min: 5, max: 1 })
  
  for (const [ltid, count] of books) {
    const bookRank = ballot.data.books[ltid] ?? 1
    if (bookRank === ranks.max) {
      // console.info(ltid, 'highest rank')
      books.set(ltid, { ...count, high: count.high + 1 })
    } else if (bookRank === ranks.min) {
      // console.info(ltid, 'lowest rank')
      books.set(ltid, { ...count, low: count.low + 1 })
    } else {
      // console.info(ltid, bookRank)
    }
  }

  console.info(maybeBallot.key, ranks)
}

for (const [ltid, count] of books.entries()) {
  console.log(`${ltid}: ${count.high} highest rank, ${count.low} lowest rank`)
}
