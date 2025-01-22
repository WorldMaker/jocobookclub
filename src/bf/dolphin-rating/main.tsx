import { ComponentDescription, Fragment, jsx, run } from '@worldmaker/butterfloat'
import { DolphinsVm } from './vm.ts'
import { Rater } from './rater.tsx'
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
  connectedCallback() {
    this.innerHTML = ''
    const ltid = this.getAttribute('ltid')
    if (ltid) {
      this.#subscription = run(this, <DolphinRating ltid={ltid} /> as ComponentDescription)
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
