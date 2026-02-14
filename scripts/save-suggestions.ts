// deno-lint-ignore-file no-import-prefix
import { slugify } from 'jsr:@bossley9/slugify@1.0.1'
import { stringify } from 'jsr:@std/yaml@1.0.5'
import { listSuggestions } from '../src/api/models/suggestion.ts'

// Save the suggestions to disk
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

const kv = await Deno.openKv(clubUrl)

const suggestions = await listSuggestions(kv)

for (const suggestion of suggestions) {
  const slug = slugify(suggestion.title)
  const filename = `src/site/held/${slug}.md`

  const contents = `
---
${stringify(suggestion, { indent: 2 })}
---

Blurb from a JoCoNaut:

> ${suggestion.whyBlurb}
 
Content warnings include ${suggestion.cw}
`

  await Deno.writeTextFile(filename, contents, {
    create: true,
  })
}

const fmtcmd = new Deno.Command(Deno.execPath(), { args: ['fmt'] })
const { code: fmtcode } = await fmtcmd.output()
console.assert(fmtcode === 0, 'Error running deno fmt')
