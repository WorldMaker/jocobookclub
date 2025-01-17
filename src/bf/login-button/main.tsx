import {
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import { map, Subscription } from 'rxjs'
import { SessionManager } from '../vm/session-manager.ts'
import Login from './login.tsx'
import User from './user.tsx'

function LoginButton() {
  const sessionManager = new SessionManager()
  const user = <User email={sessionManager.email} />
  const children = sessionManager.email.pipe(
    map((email) => {
      if (email) {
        return () => user
      }
      return Login
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class LoginButtonComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    const stampCollection = new StampCollection()
    const login = this.ownerDocument.getElementById('login-button-login')
    if (login) {
      stampCollection.registerOnlyStamp(Login, login as HTMLTemplateElement)
    }
    const user = this.ownerDocument.getElementById('login-button-user')
    if (user) {
      stampCollection.registerOnlyStamp(User, user as HTMLTemplateElement)
    }
    this.#subscription = runStamps(this, LoginButton, stampCollection)
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('login-button', LoginButtonComponent)

export default LoginButtonComponent
