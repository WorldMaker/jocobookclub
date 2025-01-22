import {
  ComponentContext,
  Fragment,
  jsx,
  ObservableEvent,
  run,
} from '@worldmaker/butterfloat'
import ballotManager, { BallotManager } from './vm/ballot-manager.ts'
import { map, Subscription } from 'rxjs'

interface VoteButtonProps {
  vm: BallotManager
}

interface VoteButtonEvents {
  vote: ObservableEvent<MouseEvent>
}

function VoteButton(
  { vm }: VoteButtonProps,
  { bindEffect, events }: ComponentContext<VoteButtonEvents>,
) {
  bindEffect(events.vote, async (_) => await vm.vote())
  return (
    <button
      class='button is-fullwidth'
      bind={{ disabled: vm.unsaved.pipe(map((unsaved) => !unsaved)) }}
      classBind={{ 'is-primary': vm.unsaved }}
      events={{ click: events.vote }}
    >
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-check-to-slot' />
      </span>
      <span>Vote</span>
    </button>
  )
}

function Voter() {
  const children = ballotManager.pipe(
    map((vm) => vm ? () => <VoteButton vm={vm} /> : () => <></>),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class VoteButtonComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, Voter)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('vote-button', VoteButtonComponent)

export default VoteButtonComponent
