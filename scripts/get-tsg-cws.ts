/// <reference lib="dom" />
// deno-lint-ignore-file no-import-prefix no-unversioned-import
import { extractYaml, test } from 'jsr:@std/front-matter'
import { walk } from 'jsr:@std/fs'
import { exit } from 'node:process'
import { JSDOM } from 'npm:jsdom'

interface BookAttrs {
  tsgid: string
  title: string
  author: string
}

function isBookAttrs(attrs: unknown): attrs is BookAttrs {
  return typeof attrs === 'object' && attrs !== null &&
    'tsgid' in attrs && typeof attrs.tsgid === 'string'
}

const pulledCws =
  JSON.parse(await Deno.readTextFile('./src/site/_data/cws.json')) ??
    {} as Record<string, Record<string, string>>

const cws: Record<string, Record<string, string>> = {}
const newCws: Record<string, Record<string, string>> = {}

for await (const f of walk('./src/site/', { exts: ['.md'] })) {
  console.log('Reading file', f.path)
  const content = await Deno.readTextFile(f.path)
  if (test(content)) {
    const { attrs } = extractYaml(content)
    if (isBookAttrs(attrs)) {
      if (attrs.tsgid in pulledCws) {
        console.log('Using cached CWs', {
          tsgid: attrs.tsgid,
          title: attrs.title,
          author: attrs.author,
        })
        cws[attrs.tsgid] = pulledCws[attrs.tsgid]
        continue
      }
      console.log('Pulling CWs', {
        tsgid: attrs.tsgid,
        title: attrs.title,
        author: attrs.author,
      })
      const resp = await fetch(
        `https://app.thestorygraph.com/books/${attrs.tsgid}/content_warnings_section`,
      )
      const html = await resp.text()
      const dom = new JSDOM(html)
      // The StoryGraph has some real ugly HTML structure for this…
      const cwElement = dom.window.document.querySelector(
        '.content-warnings-information',
      )
      const cwList: Record<string, string> = {}
      let cwSection = 'Uncategorized'
      for (const child of cwElement?.childNodes ?? []) {
        if (child.nodeType === dom.window.Node.ELEMENT_NODE) {
          if (child.matches('p.font-semibold')) {
            // This is a section header
            cwSection = child.textContent.trim() ?? 'Uncategorized'
          }
        } else if (child.nodeType === dom.window.Node.TEXT_NODE) {
          const text = child.textContent.trim()
          if (text.length === 0) {
            continue
          }
          cwList[cwSection] = (cwList[cwSection] ?? '') + text
        }
      }
      console.log(cwList)
      if (Object.keys(cwList).length === 0) {
        console.warn('No CWs found for', {
          tsgid: attrs.tsgid,
          title: attrs.title,
        })
        const intentional = dom.window.document.querySelector('.book-pane > p')
          .textContent.includes("doesn't have any")
        if (!intentional) {
          console.log(dom.serialize())
          exit(1)
        }
      } else {
        cws[attrs.tsgid] = cwList
        newCws[`${attrs.title} by ${attrs.author}`] = cwList
      }
    }
  }
}

console.log('New CWs', newCws)

const encoder = new TextEncoder()
const data = encoder.encode(JSON.stringify(cws, null, 2))
await Deno.writeFile('./src/site/_data/cws.json', data)

const fmtcmd = new Deno.Command(Deno.execPath(), { args: ['fmt'] })
const { code: fmtcode } = await fmtcmd.output()
console.assert(fmtcode === 0, 'Error running deno fmt')
