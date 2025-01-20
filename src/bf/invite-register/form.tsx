import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { Invite } from '@worldmaker/jocobookclub-api/models'
import { RegistrationVm } from './vm.ts'

export interface InviteRegistrationFormProps {
  invite: Invite
  vm: RegistrationVm
}

interface InviteRegistrationFormEvents {
  emailChanged: ObservableEvent<InputEvent>
  submit: ObservableEvent<MouseEvent>
}

export default function InviteRegistrationForm(
  { invite, vm }: InviteRegistrationFormProps,
  { bindEffect, bindImmediateEffect, events }: ComponentContext<InviteRegistrationFormEvents>
) {
  bindImmediateEffect(events.emailChanged, e => vm.emailChanged(e.data))
  bindEffect(events.submit, _ => vm.register(invite.id))
  return (
    <section class='section'>
      <h1 class='title'>Register</h1>
      <p>
        Register with a Passkey. <strong>TIP:</strong>{' '}
        Best results may be to login first on iOS or Android.
      </p>

      <div class='field'>
        <label class='label' for='email' events={{ change: events.emailChanged }}>Email</label>
        <div class='control'>
          <input
            class='input'
            type='text'
            id='email'
            name='email'
            required
            autocomplete='username'
            value={invite.type === 'specific-email' ? invite.email : ''}
            disabled={invite.type === 'specific-email'}
          />
        </div>
      </div>
      <div class='field'>
        <div class='control'>
          <button class='button' events={{ click: events.submit }}>Register Passkey</button>
        </div>
      </div>
    </section>
  )
}
