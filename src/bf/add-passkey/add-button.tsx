import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { RegistrationVm } from './vm.ts'

export interface AddPasskeyProps {
  vm: RegistrationVm
}

interface AddPasskeyEvents {
  click: ObservableEvent<MouseEvent>
}

export function AddPasskey(
  { vm }: AddPasskeyProps,
  { bindEffect, events }: ComponentContext<AddPasskeyEvents>,
) {
  const { click } = events
  bindEffect(click, async _ => await vm.register())
  return (
    <button class='button is-primary' events={{ click }}>Add Passkey</button>
  )
}
