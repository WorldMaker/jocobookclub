import {
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import sessionManager from '../vm/session-manager.ts'
import { map, Subscription } from 'rxjs'
import { Logout } from './logout.tsx'
import { Login } from './login.tsx'

function LogoutButton() {
  const children = sessionManager.session.pipe(
    map((session) => session ? () => <Logout session={session} /> : Login),
  )

  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class LogoutButtonElement extends HTMLElement {
  #subscription: Subscription | null = null
  static #logoutStamp: HTMLTemplateElement | null = null
  static #loginStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    LogoutButtonElement.#logoutStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#logout-button')
    LogoutButtonElement.#loginStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#login-notice')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (LogoutButtonElement.#logoutStamp) {
      stamps.registerOnlyStamp(Logout, LogoutButtonElement.#logoutStamp)
    }
    if (LogoutButtonElement.#loginStamp) {
      stamps.registerOnlyStamp(Login, LogoutButtonElement.#loginStamp)
    }
    this.#subscription = runStamps(this, LogoutButton, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('logout-button', LogoutButtonElement)

export default LogoutButtonElement
