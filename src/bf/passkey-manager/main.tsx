import { Fragment, jsx, runStamps, StampCollection } from '@worldmaker/butterfloat'
import { Table } from './table.tsx'
import { Login } from '../logout-button/login.tsx'
import sessionManager from '../vm/session-manager.ts'
import { map, type Subscription } from 'rxjs'

function PasskeyManager() {
  const children = sessionManager.session.pipe(
    map((session) => session ? () => <Table session={session} /> : Login),
  )

  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class PasskeyManagerElement extends HTMLElement {
  #subscription: Subscription | null = null
  static #loginStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    PasskeyManagerElement.#loginStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#login-notice')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (PasskeyManagerElement.#loginStamp) {
      stamps.registerOnlyStamp(Login, PasskeyManagerElement.#loginStamp)
    }
    this.#subscription = runStamps(this, PasskeyManager, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('passkey-manager', PasskeyManagerElement)

export default PasskeyManagerElement
