// deno-lint-ignore-file no-import-prefix
import { slugify } from 'jsr:@bossley9/slugify@1.0.1'
import { stringify } from 'jsr:@std/yaml@1.0.5'
import { apiClient } from './api/client.ts'
import { superLogin } from './api/super-login.ts'

// Save the suggestions to disk
// You will need to configure environment variable CLUB_SUPER_TOKEN with a super token
// You may configure environment variable CLUB_API_URL to point to a different API URL

const session = await superLogin('01KQG5TEJBPPJTS8S44WSMYZPS', 'bot+save-suggestions@example.com')

const response = await apiClient.suggestion.$get({}, {
  headers: {
    Authorization: `Bearer ${session.token}`,
  },
})
if (!response.ok) {
  console.error('Error getting suggestions', await response.text())
  Deno.exit(2)
}

const { suggestions } = await response.json()

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
