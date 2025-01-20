import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import { RegistrationVm } from './vm.ts'
import { map, Subscription } from 'rxjs'
import { AddPasskey } from './add-button.tsx'
import { Success } from './success.tsx'
import { RegistrationError } from './error.tsx'
import { Skeleton } from './skeleton.tsx'
import { UserCheck } from './user-check.tsx'
import { SessionError } from './session-error.tsx'
import { VerificationError } from './verification-error.tsx'
import { Login } from '../logout-button/login.tsx'

function PasskeyRegistration() {
  const vm = new RegistrationVm()
  const children = vm.state.pipe(
    map((state) => {
      switch (state.type) {
        case 'idle':
          return () => <AddPasskey vm={vm} />
        case 'logged-out':
          return Login
        case 'success':
          return Success
        case 'error':
          return () => <RegistrationError error={state.error} />
        case 'user-check':
          return () => (
            <UserCheck
              backedup={state.backedup}
              multiDevice={state.multiDevice}
            />
          )
        case 'session-error':
          return SessionError
        case 'verification-error':
          return VerificationError
        case 'busy':
        default:
          return Skeleton
      }
    }),
  )
  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class PasskeyRegistrationComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, PasskeyRegistration)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}
customElements.define('add-passkey', PasskeyRegistrationComponent)

export default PasskeyRegistrationComponent
