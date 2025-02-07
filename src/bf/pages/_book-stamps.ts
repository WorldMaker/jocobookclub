import {
  buildStamp,
  makeTestComponentContext,
  makeTestEvent,
} from '@worldmaker/butterfloat'
import { Dolphin, type DolphinEvents } from '../dolphin-rating/rater.tsx'
import { NEVER } from 'rxjs'
import { DolphinsVm } from '../dolphin-rating/vm.ts'

export async function buildBookStamps(document: Document) {
  // paths are relative to the project root
  await Deno.mkdir('../site/_includes/bf', { recursive: true })
  await Deno.writeTextFile('../site/_includes/bf/book-page.html', '', {
    create: true,
  })

  // *** Dolphin Rater ***

  const { context: dolphinContext } = makeTestComponentContext<DolphinEvents>({
    hover: makeTestEvent(NEVER),
    click: makeTestEvent(NEVER),
  })
  const dolphin = Dolphin(
    { rank: -999, vm: new DolphinsVm('FAKE') },
    dolphinContext,
  )
  const dolphinStamp = buildStamp(dolphin, document)
  dolphinStamp.id = 'dolphin-rating-dolphin'
  await Deno.writeTextFile(
    '../site/_includes/bf/book-page.html',
    dolphinStamp.outerHTML,
    { append: true },
  )
}
