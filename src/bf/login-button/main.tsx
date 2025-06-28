import {
  butterfly,
  ComponentDescription,
  Fragment,
  jsx,
  run,
  StateSetter,
} from '@worldmaker/butterfloat'
import { map, Observable, Subscription } from 'rxjs'
import sessionManager from '../vm/session-manager.ts'
import Login from './login.tsx'
import User from './user.tsx'

interface LoginButtonProps {
  loginUrl: string | null
  passkeyUrl: string | null
  active: Observable<boolean>
}

function LoginButton({ loginUrl, passkeyUrl, active }: LoginButtonProps) {
  const user = (
    <User
      email={sessionManager.email}
      session={sessionManager.session}
      url={passkeyUrl}
    />
  )
  const login = <Login url={loginUrl} active={active} />
  const children = sessionManager.session.pipe(
    map((session) => {
      if (session) {
        return () => user
      }
      return () => login
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class LoginButtonComponent extends HTMLElement {
  #subscription: Subscription | null = null
  #active: Observable<boolean>
  #setActive: (active: StateSetter<boolean>) => void

  static get observedAttributes() {
    return ['active']
  }

  constructor() {
    super()
    ;[this.#active, this.#setActive] = butterfly(false)
  }

  set active(active: boolean) {
    this.#setActive(active)
  }

  connectedCallback() {
    this.innerHTML = ''
    const loginUrl = this.getAttribute('login')
    const passkeyUrl = this.getAttribute('passkey')
    const active = this.getAttribute('active') === 'true' ? true : false
    this.#setActive(active)
    this.#subscription = run(
      this,
      (
        <LoginButton
          loginUrl={loginUrl}
          passkeyUrl={passkeyUrl}
          active={this.#active}
        />
      ) as ComponentDescription,
    )
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === 'active') {
      this.#setActive(newValue === 'true')
    }
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('login-button', LoginButtonComponent)

export default LoginButtonComponent
