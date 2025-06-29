import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { LoginFormVm } from './vm.ts'

export interface QuickLoginProps {
  vm: LoginFormVm
  email: string
}

export interface QuickLoginEvents {
  login: ObservableEvent<MouseEvent>
}

export function QuickLogin(
  { vm, email }: QuickLoginProps,
  { bindImmediateEffect, events }: ComponentContext<QuickLoginEvents>,
) {
  bindImmediateEffect(events.login, (e) => {
    e.preventDefault()
    vm.loginWithEmail(email)
  })

  return (
    <button
      type='button'
      class='button is-info is-fullwidth'
      events={{ click: events.login }}
    >
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-key' />
      </span>
      <span>Log in as {email}</span>
    </button>
  )
}
