import {
  buildStamp,
  makeTestComponentContext,
  makeTestEvent,
} from '@worldmaker/butterfloat'
import { Dolphin, type DolphinEvents } from '../dolphin-rating/rater.tsx'
import { DolphinsVm } from '../dolphin-rating/vm.ts'
import { SortButton, SortPicker } from '../sort-picker.tsx'
import { NEVER } from 'rxjs'
import {
  ActivateButton,
  type ActivateButtonEvents,
  DeactivateButton,
  VoteButton,
  type VoteButtonEvents,
} from '../vote-button.tsx'
import { BallotManager } from '../vm/ballot-manager.ts'

export async function buildTagPageStamps(document: Document) {
  const path = '../site/_includes/bf/tag-page.html'

  // paths are relative to the project root
  await Deno.mkdir('../site/_includes/bf', { recursive: true })
  await Deno.writeTextFile(path, '', {
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
    path,
    dolphinStamp.outerHTML,
    { append: true },
  )

  // *** Sort Picker ***

  const { context: sortContext } = makeTestComponentContext({
    click: makeTestEvent<MouseEvent>(NEVER),
  })
  const titleButton = SortButton({ sort: 'title', name: 'Title' }, sortContext)
  const titleButtonStamp = buildStamp(titleButton, document)
  titleButtonStamp.id = 'sort-picker-title'
  await Deno.writeTextFile(
    path,
    titleButtonStamp.outerHTML,
    { append: true },
  )
  const authorButton = SortButton(
    { sort: 'author', name: 'Author' },
    sortContext,
  )
  const authorButtonStamp = buildStamp(authorButton, document)
  authorButtonStamp.id = 'sort-picker-author'
  await Deno.writeTextFile(
    path,
    authorButtonStamp.outerHTML,
    { append: true },
  )
  const rankButton = SortButton({ sort: 'rank', name: 'Rank' }, sortContext)
  const rankButtonStamp = buildStamp(rankButton, document)
  rankButtonStamp.id = 'sort-picker-rank'
  await Deno.writeTextFile(
    path,
    rankButtonStamp.outerHTML,
    { append: true },
  )

  const sortPicker = SortPicker()
  const sortPickerStamp = buildStamp(sortPicker, document)
  sortPickerStamp.id = 'sort-picker'
  await Deno.writeTextFile(
    path,
    sortPickerStamp.outerHTML,
    { append: true },
  )

  // *** Vote Button ***

  const { context: activateContext } = makeTestComponentContext<
    ActivateButtonEvents
  >({
    click: makeTestEvent(NEVER),
  })
  const bm = new BallotManager({
    token: 'FAKE',
    userId: 'FAKE',
    expiresAt: new Date(),
  })
  const activateButton = ActivateButton({ vm: bm }, activateContext)
  const activateButtonStamp = buildStamp(activateButton, document)
  activateButtonStamp.id = 'vote-button-activate'
  await Deno.writeTextFile(
    path,
    activateButtonStamp.outerHTML,
    { append: true },
  )
  const deactivateButton = DeactivateButton({ vm: bm }, activateContext)
  const deactivateButtonStamp = buildStamp(deactivateButton, document)
  deactivateButtonStamp.id = 'vote-button-deactivate'
  await Deno.writeTextFile(
    path,
    deactivateButtonStamp.outerHTML,
    { append: true },
  )

  const { context: voteContext } = makeTestComponentContext<VoteButtonEvents>({
    vote: makeTestEvent(NEVER),
  })
  const voteButton = VoteButton({ vm: bm }, voteContext)
  const voteButtonStamp = buildStamp(voteButton, document)
  voteButtonStamp.id = 'vote-button'
  await Deno.writeTextFile(
    path,
    voteButtonStamp.outerHTML,
    { append: true },
  )
}
