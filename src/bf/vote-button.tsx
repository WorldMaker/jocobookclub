import {
  ComponentContext,
  Fragment,
  jsx,
  ObservableEvent,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import ballotManager, { BallotManager } from './vm/ballot-manager.ts'
import { map, Subscription } from 'rxjs'

interface VoteButtonProps {
  vm: BallotManager
}

export interface ActivateButtonEvents {
  click: ObservableEvent<MouseEvent>
}

export function ActivateButton(
  { vm }: VoteButtonProps,
  { bindEffect, events }: ComponentContext<ActivateButtonEvents>,
) {
  bindEffect(events.click, (_) => vm.activate())
  return (
    <p>
      Back from a break?{' '}
      <button
        type='button'
        class='button is-small'
        events={{ click: events.click }}
      >
        <span class='icon'>
          <i className='fa-duotone fa-solid fa-check-to-slot'></i>
        </span>{' '}
        <span>Reactivate your Ballot</span>
      </button>
    </p>
  )
}

export function DeactivateButton(
  { vm }: VoteButtonProps,
  { bindEffect, events }: ComponentContext<ActivateButtonEvents>,
) {
  bindEffect(events.click, (_) => vm.deactivate())
  return (
    <p>
      Going on a break?{' '}
      <button
        type='button'
        class='button is-small'
        events={{ click: events.click }}
      >
        <span class='icon'>
          <i className='fa-duotone fa-solid fa-xmark-to-slot'></i>
        </span>{' '}
        <span>Deactivate your Ballot</span>
      </button>
    </p>
  )
}

export interface VoteButtonEvents {
  vote: ObservableEvent<MouseEvent>
}

export function VoteButton(
  { vm }: VoteButtonProps,
  { bindEffect, events }: ComponentContext<VoteButtonEvents>,
) {
  bindEffect(events.vote, async (_) => await vm.vote())
  const activateButton = vm.active.pipe(
    map((active) =>
      active
        ? () => <DeactivateButton vm={vm} />
        : () => <ActivateButton vm={vm} />
    ),
  )
  return (
    <div class='container'>
      <div
        class='block'
        childrenBind={activateButton}
        childrenBindMode='replace'
      >
      </div>
      <div class='block'>
        <button
          type='button'
          class='button is-fullwidth'
          bind={{ disabled: vm.unsaved.pipe(map((unsaved) => !unsaved)) }}
          classBind={{ 'is-primary': vm.unsaved }}
          events={{ click: events.vote }}
        >
          <span class='icon'>
            <i
              class='fa-duotone fa-solid'
              classBind={{
                'fa-check-to-slot': vm.active,
                'fa-xmark-to-slot': vm.active.pipe(map((active) => !active)),
              }}
            />
          </span>
          <span>Save Vote</span>
        </button>
      </div>
    </div>
  )
}

function Voter() {
  const children = ballotManager.pipe(
    // deno-lint-ignore jsx-no-useless-fragment
    map((vm) => vm ? () => <VoteButton vm={vm} /> : () => <></>),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class VoteButtonComponent extends HTMLElement {
  #subscription: Subscription | null = null
  static #voteButtonStamp: HTMLTemplateElement | null = null
  static #activateButtonStamp: HTMLTemplateElement | null = null
  static #deactivateButtonStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    VoteButtonComponent.#voteButtonStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#vote-button')
    VoteButtonComponent.#activateButtonStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#vote-button-activate')
    VoteButtonComponent.#deactivateButtonStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#vote-button-deactivate')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (VoteButtonComponent.#voteButtonStamp) {
      stamps.registerOnlyStamp(VoteButton, VoteButtonComponent.#voteButtonStamp)
    }
    if (VoteButtonComponent.#activateButtonStamp) {
      stamps.registerOnlyStamp(
        ActivateButton,
        VoteButtonComponent.#activateButtonStamp,
      )
    }
    if (VoteButtonComponent.#deactivateButtonStamp) {
      stamps.registerOnlyStamp(
        DeactivateButton,
        VoteButtonComponent.#deactivateButtonStamp,
      )
    }
    this.#subscription = runStamps(this, Voter, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('vote-button', VoteButtonComponent)

export default VoteButtonComponent
