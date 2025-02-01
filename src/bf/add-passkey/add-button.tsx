import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { RegistrationVm } from './vm.ts'

export interface AddPasskeyProps {
  vm: RegistrationVm
  session: Session
}

export interface AddPasskeyEvents {
  click: ObservableEvent<MouseEvent>
}

export function AddPasskey(
  { vm, session }: AddPasskeyProps,
  { bindEffect, events }: ComponentContext<AddPasskeyEvents>,
) {
  const { click } = events
  bindEffect(click, async (_) => await vm.register(session))
  return (
    <button class='button is-primary' events={{ click }}>
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-key'></i>
      </span>{' '}
      <span>Add Passkey</span>
    </button>
  )
}
