import { Fragment, jsx, run } from '@worldmaker/butterfloat'
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

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, LogoutButton)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('logout-button', LogoutButtonElement)

export default LogoutButtonElement
