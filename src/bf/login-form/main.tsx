import { Fragment, jsx, run } from '@worldmaker/butterfloat'
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

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, LoginForm)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('login-form', LoginFormComponent)

export default LoginFormComponent
