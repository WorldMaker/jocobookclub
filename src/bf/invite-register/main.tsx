/// <reference lib="dom" />
import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import { Subscription, map } from 'rxjs'
import AlreadyLoggedIn from './logged-in.tsx'
import InvalidInvite from './invalid-invite.tsx'
import InviteRegistrationFormSkeleton from './skeleton.tsx'
import InviteRegistrationForm from './form.tsx'
import { RegistrationVm } from './vm.ts'
import { Success } from '../add-paskey/success.tsx'
import { RegistrationError } from '../add-paskey/error.tsx'
import { UserCheck } from '../add-paskey/user-check.tsx'
import { SessionError } from '../add-paskey/session-error.tsx'
import { VerificationError } from '../add-paskey/verification-error.tsx'

function InviteRegister() {
  const vm = new RegistrationVm()
  const children = vm.state.pipe(
    map((state) => {
      switch (state.type) {
        case 'logged-in':
          return AlreadyLoggedIn
        case 'invalid-invite':
          return InvalidInvite
        case 'invited':
          return () => <InviteRegistrationForm invite={state.invite} vm={vm} />
        case 'success':
          return Success
        case 'error':
          return () => <RegistrationError error={state.error} />
        case 'user-check':
          return () => <UserCheck backedup={state.backedup} multiDevice={state.multiDevice} />
        case 'session-error':
          return SessionError
        case 'verification-error':
          return VerificationError
        case 'busy':
        default:
          return InviteRegistrationFormSkeleton
      }
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class InviteRegisterComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, InviteRegister)
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('invite-register', InviteRegisterComponent)

export default InviteRegisterComponent
