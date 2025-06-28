import {
  ComponentDescription,
  Fragment,
  jsx,
  run,
} from '@worldmaker/butterfloat'
import { map, Subscription } from 'rxjs'
import sessionManager from '../vm/session-manager.ts'
import Login from './login.tsx'
import User from './user.tsx'

interface LoginButtonProps {
  loginUrl: string | null
  passkeyUrl: string | null
  active: boolean
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

  connectedCallback() {
    this.innerHTML = ''
    const loginUrl = this.getAttribute('login')
    const passkeyUrl = this.getAttribute('passkey')
    const active = this.getAttribute('active') === 'true' ? true : false
    this.#subscription = run(
      this,
      (
        <LoginButton
          loginUrl={loginUrl}
          passkeyUrl={passkeyUrl}
          active={active}
        />
      ) as ComponentDescription,
    )
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('login-button', LoginButtonComponent)

export default LoginButtonComponent
