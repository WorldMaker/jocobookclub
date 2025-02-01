import {
  Fragment,
  jsx,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'
import { LoginFormVm } from './vm.ts'
import { map, Subscription } from 'rxjs'
import { Error } from './error.tsx'
import { Form } from './form.tsx'
import { Success } from './success.tsx'
import { Skeleton } from './skeleton.tsx'

function LoginForm() {
  const vm = new LoginFormVm()
  const children = vm.state.pipe(
    map((state) => {
      switch (state.type) {
        case 'idle':
          return () => <Form vm={vm} />
        case 'error':
          return Error
        case 'success':
          return Success
        case 'busy':
        default:
          return Skeleton
      }
    }),
  )

  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class LoginFormComponent extends HTMLElement {
  #subscription: Subscription | null = null
  static #loginFormStamp: HTMLTemplateElement | null = null
  static #loginFormErrorStamp: HTMLTemplateElement | null = null
  static #loginFormSuccessStamp: HTMLTemplateElement | null = null
  static #loginFormSkeletonStamp: HTMLTemplateElement | null = null

  constructor() {
    super()
    LoginFormComponent.#loginFormStamp ??= this.ownerDocument.querySelector<
      HTMLTemplateElement
    >('#login-form')
    LoginFormComponent.#loginFormErrorStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#login-form-error')
    LoginFormComponent.#loginFormSuccessStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#login-form-success')
    LoginFormComponent.#loginFormSkeletonStamp ??= this.ownerDocument
      .querySelector<HTMLTemplateElement>('#login-form-skeleton')
  }

  connectedCallback() {
    this.innerHTML = ''
    const stamps = new StampCollection()
    if (LoginFormComponent.#loginFormStamp) {
      stamps.registerOnlyStamp(Form, LoginFormComponent.#loginFormStamp)
    }
    if (LoginFormComponent.#loginFormErrorStamp) {
      stamps.registerOnlyStamp(Error, LoginFormComponent.#loginFormErrorStamp)
    }
    if (LoginFormComponent.#loginFormSuccessStamp) {
      stamps.registerOnlyStamp(
        Success,
        LoginFormComponent.#loginFormSuccessStamp,
      )
    }
    if (LoginFormComponent.#loginFormSkeletonStamp) {
      stamps.registerOnlyStamp(
        Skeleton,
        LoginFormComponent.#loginFormSkeletonStamp,
      )
    }
    this.#subscription = runStamps(this, LoginForm, stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('login-form', LoginFormComponent)

export default LoginFormComponent
