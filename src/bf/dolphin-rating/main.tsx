import {
  ComponentDescription,
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import { DolphinsVm } from './vm.ts'
import { Dolphin, Rater } from './rater.tsx'
import { map, Subscription } from 'rxjs'

interface DolphinRatingProps {
  ltid: string
}

function DolphinRating({ ltid }: DolphinRatingProps) {
  const vm = new DolphinsVm(ltid)
  const children = vm.hasBallot.pipe(
    map((hasBallot) => hasBallot ? () => <Rater vm={vm} /> : () => <></>),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class DolphinRatingComponent extends HTMLElement {
  #subscription: Subscription | null = null
  static #dolphinStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    DolphinRatingComponent.#dolphinStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#dolphin-rating-dolphin')
  }

  connectedCallback() {
    this.innerHTML = ''
    const ltid = this.getAttribute('ltid')
    if (ltid) {
      const stamps = new StampCollection()
      if (DolphinRatingComponent.#dolphinStamp) {
        stamps.registerOnlyStamp(Dolphin, DolphinRatingComponent.#dolphinStamp)
      }
      this.#subscription = runStamps(
        this,
        <DolphinRating ltid={ltid} /> as ComponentDescription,
        stamps,
      )
    }
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('dolphin-rating', DolphinRatingComponent)

export default DolphinRatingComponent
