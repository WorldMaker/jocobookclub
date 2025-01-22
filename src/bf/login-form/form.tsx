import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { LoginFormVm } from './vm.ts'

export interface FormProps {
  vm: LoginFormVm
}

export interface FormEvents {
  emailChanged: ObservableEvent<InputEvent>
  login: ObservableEvent<SubmitEvent>
}

export function Form(
  { vm }: FormProps,
  { bindImmediateEffect, events }: ComponentContext<FormEvents>,
) {
  bindImmediateEffect(
    events.emailChanged,
    (e) => vm.emailChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(events.login, async (e) => {
    e.preventDefault()
    await vm.login()
  })

  return (
    <form events={{ submit: events.login }}>
      <div class='field'>
        <label class='label' for='email'>Email</label>
        <div class='control'>
          <input
            id='email'
            name='email'
            class='input'
            type='email'
            autocomplete='username webauthn'
            events={{ change: events.emailChanged }}
          />
        </div>
      </div>
      <div class='field'>
        <div class='control'>
          <button class='button is-primary' type='submit'>
            <span class='icon'>
              <i class='fa-duotone fa-solid fa-key' />
            </span>
            <span>Login</span>
          </button>
        </div>
      </div>
    </form>
  )
}
