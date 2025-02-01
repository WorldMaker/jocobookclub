/// <reference lib="dom" />
import {
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import { map, Subscription } from 'rxjs'
import AlreadyLoggedIn from './logged-in.tsx'
import InvalidInvite from './invalid-invite.tsx'
import InviteRegistrationFormSkeleton from './skeleton.tsx'
import InviteRegistrationForm from './form.tsx'
import { RegistrationVm } from './vm.ts'
import { Success } from '../add-passkey/success.tsx'
import { RegistrationError } from '../add-passkey/error.tsx'
import { UserCheck } from '../add-passkey/user-check.tsx'
import { SessionError } from '../add-passkey/session-error.tsx'
import { VerificationError } from '../add-passkey/verification-error.tsx'

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
  static #inviteRegisterForm: HTMLTemplateElement | null = null
  static #inviteRegisterInvalid: HTMLTemplateElement | null = null
  static #inviteRegisterLoggedIn: HTMLTemplateElement | null = null
  static #inviteRegisterSkeleton: HTMLTemplateElement | null = null
  static #inviteRegisterSuccess: HTMLTemplateElement | null = null
  static #inviteRegisterSessionError: HTMLTemplateElement | null = null
  static #inviteRegisterVerificationError: HTMLTemplateElement | null = null

  constructor() {
    super()
    InviteRegisterComponent.#inviteRegisterForm ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#invite-register-form')
    InviteRegisterComponent.#inviteRegisterInvalid ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#invite-register-invalid')
    InviteRegisterComponent.#inviteRegisterLoggedIn ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#invite-register-logged-in')
    InviteRegisterComponent.#inviteRegisterSkeleton ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#invite-register-skeleton')
    InviteRegisterComponent.#inviteRegisterSuccess ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#passkey-success')
    InviteRegisterComponent.#inviteRegisterSessionError ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#session-error')
    InviteRegisterComponent.#inviteRegisterVerificationError ??= this
      .ownerDocument.querySelector<HTMLTemplateElement>('#verification-error')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (InviteRegisterComponent.#inviteRegisterForm) {
      stamps.registerStampAlternative(
        InviteRegistrationForm,
        (p) => p.invite.type === 'open-enrollment',
        InviteRegisterComponent.#inviteRegisterForm,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterInvalid) {
      stamps.registerOnlyStamp(
        InvalidInvite,
        InviteRegisterComponent.#inviteRegisterInvalid,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterLoggedIn) {
      stamps.registerOnlyStamp(
        AlreadyLoggedIn,
        InviteRegisterComponent.#inviteRegisterLoggedIn,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterSkeleton) {
      stamps.registerOnlyStamp(
        InviteRegistrationFormSkeleton,
        InviteRegisterComponent.#inviteRegisterSkeleton,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterSuccess) {
      stamps.registerOnlyStamp(
        Success,
        InviteRegisterComponent.#inviteRegisterSuccess,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterSessionError) {
      stamps.registerOnlyStamp(
        SessionError,
        InviteRegisterComponent.#inviteRegisterSessionError,
      )
    }
    if (InviteRegisterComponent.#inviteRegisterVerificationError) {
      stamps.registerOnlyStamp(
        VerificationError,
        InviteRegisterComponent.#inviteRegisterVerificationError,
      )
    }
    this.#subscription = runStamps(this, InviteRegister, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('invite-register', InviteRegisterComponent)

export default InviteRegisterComponent
