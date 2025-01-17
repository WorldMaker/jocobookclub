import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import { map, Subscription } from 'rxjs'
import { SessionManager } from '../vm/session-manager.ts'
import Login from './login.tsx'
import User from './user.tsx'

function LoginButton() {
  const sessionManager = new SessionManager()
  const children = sessionManager.email.pipe(
    map(email => {
      if (email) {
        return () => <User email={email} />
      }
      return Login
    })
  )
  return <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
}

class LoginButtonComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, LoginButton)
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('login-button', LoginButtonComponent)

export default LoginButtonComponent
