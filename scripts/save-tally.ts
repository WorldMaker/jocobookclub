// deno-lint-ignore-file no-import-prefix no-unversioned-import
import { parseArgs } from 'jsr:@std/cli'
import { apiClient } from './api/client.ts'
import { superLogin } from './api/super-login.ts'

// Save the final tally to disk
// You will need to configure environment variable CLUB_SUPER_TOKEN with a super token
// You may configure environment variable CLUB_API_URL to point to a different API URL

const args = parseArgs(Deno.args, {
  boolean: ['force'],
})

const session = await superLogin(
  '01KQG5JD28HXP8EFDE90CX15V5',
  'bot+save-tally@example.com',
)

const response = await apiClient.user['final-tally'].$get({}, {
  headers: {
    Authorization: `Bearer ${session.token}`,
  },
})

if (!response.ok) {
  console.error('Error getting final tally', await response.text())
  Deno.exit(2)
}

const finalTally = await response.json()
const updated = new Date(finalTally.updated).toTemporalInstant()
  .toZonedDateTimeISO('America/New_York')
const now = Temporal.Now.zonedDateTimeISO('America/New_York')

console.info(updated)

// If it's before 4am, we want to use yesterday's date for the filename
// because GitHub Actions cron may be delayed
const useYesterday = now.hour < 4
const startOfDay = useYesterday
  ? now.subtract({ days: 1 }).startOfDay()
  : now.startOfDay()

if (
  !args.force &&
  Temporal.ZonedDateTime.compare(updated.startOfDay(), startOfDay) !== 0
) {
  console.log(
    `Final tally is not from ${
      startOfDay.toLocaleString(undefined, { dateStyle: 'short' })
    }`,
  )
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
