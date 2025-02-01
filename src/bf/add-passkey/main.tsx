import {
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
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
        case 'ready':
          return () => <AddPasskey vm={vm} session={state.session} />
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
  static #addPasskeyStamp: HTMLTemplateElement | null = null
  static #sessionErrorStamp: HTMLTemplateElement | null = null
  static #skeletonStamp: HTMLTemplateElement | null = null
  static #successStamp: HTMLTemplateElement | null = null
  static #verificationErrorStamp: HTMLTemplateElement | null = null
  static #loginStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    PasskeyRegistrationComponent.#addPasskeyStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#add-passkey')
    PasskeyRegistrationComponent.#sessionErrorStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#session-error')
    PasskeyRegistrationComponent.#skeletonStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#passkey-skeleton')
    PasskeyRegistrationComponent.#successStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#passkey-success')
    PasskeyRegistrationComponent.#verificationErrorStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#verification-error')
    PasskeyRegistrationComponent.#loginStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#login-notice')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (PasskeyRegistrationComponent.#addPasskeyStamp) {
      stamps.registerOnlyStamp(
        AddPasskey,
        PasskeyRegistrationComponent.#addPasskeyStamp,
      )
    }
    if (PasskeyRegistrationComponent.#sessionErrorStamp) {
      stamps.registerOnlyStamp(
        SessionError,
        PasskeyRegistrationComponent.#sessionErrorStamp,
      )
    }
    if (PasskeyRegistrationComponent.#skeletonStamp) {
      stamps.registerOnlyStamp(
        Skeleton,
        PasskeyRegistrationComponent.#skeletonStamp,
      )
    }
    if (PasskeyRegistrationComponent.#successStamp) {
      stamps.registerOnlyStamp(
        Success,
        PasskeyRegistrationComponent.#successStamp,
      )
    }
    if (PasskeyRegistrationComponent.#verificationErrorStamp) {
      stamps.registerOnlyStamp(
        VerificationError,
        PasskeyRegistrationComponent.#verificationErrorStamp,
      )
    }
    if (PasskeyRegistrationComponent.#loginStamp) {
      stamps.registerOnlyStamp(Login, PasskeyRegistrationComponent.#loginStamp)
    }
    this.#subscription = runStamps(this, PasskeyRegistration, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}
customElements.define('add-passkey', PasskeyRegistrationComponent)

export default PasskeyRegistrationComponent
