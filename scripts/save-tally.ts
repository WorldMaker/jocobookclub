// deno-lint-ignore-file no-import-prefix no-unversioned-import
import { parseArgs } from 'jsr:@std/cli'
import { getFinalTally } from '../src/api/models/tally.ts'

// Save the final tally to disk
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
  boolean: ['force'],
})

const kv = await Deno.openKv(clubUrl)

const tally = await getFinalTally(kv)

if (!tally.success) {
  console.error('Error getting final tally')
  Deno.exit(2)
}

const finalTally = tally.data
const updated = new Date(finalTally.updated).toTemporalInstant()
  .toZonedDateTimeISO('America/New_York')
const now = Temporal.Now.zonedDateTimeISO('America/New_York')

console.info(updated)

if (
  !args.force &&
  Temporal.ZonedDateTime.compare(updated.startOfDay(), now.startOfDay()) !== 0
) {
  console.log('Final tally is not from today')
  Deno.exit(0)
}

const filename = `src/site/_vote-history/${updated.year}-${
  updated.month.toString().padStart(2, '0')
}-${updated.day.toString().padStart(2, '0')}.json`

await Deno.writeTextFile(filename, JSON.stringify(finalTally, null, 2), {
  create: true,
})

const fmtcmd = new Deno.Command(Deno.execPath(), { args: ['fmt'] })
const { code: fmtcode } = await fmtcmd.output()
console.assert(fmtcode === 0, 'Error running deno fmt')
