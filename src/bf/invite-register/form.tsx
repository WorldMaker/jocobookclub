import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { Invite } from '@worldmaker/jocobookclub-api/models'
import { RegistrationVm } from './vm.ts'

export interface InviteRegistrationFormProps {
  invite: Invite
  vm: RegistrationVm
}

export interface InviteRegistrationFormEvents {
  emailChanged: ObservableEvent<InputEvent>
  submit: ObservableEvent<SubmitEvent>
}

export default function InviteRegistrationForm(
  { invite, vm }: InviteRegistrationFormProps,
  { bindImmediateEffect, events }: ComponentContext<
    InviteRegistrationFormEvents
  >,
) {
  bindImmediateEffect(
    events.emailChanged,
    (e) => vm.emailChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(events.submit, async (e) => {
    e.preventDefault()
    await vm.register(invite.id)
  })
  return (
    <section class='section'>
      <h1 class='title'>Register</h1>
      <p class='block'>
        Register with a Passkey. <strong>TIP:</strong>{' '}
        Passkeys from iOS or Android are easier to use on Windows{' '}
        than the other way around, in many cases.
      </p>

      <p class='block'>
        If arriving from Facebook on mobile, you may need to "Open in
        External Browser" to be able to register successfully.
      </p>

      <form events={{ submit: events.submit }}>
        <div class='field'>
          <label
            class='label'
            for='email'
            events={{ change: events.emailChanged }}
          >
            Email
          </label>
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
              events={{ change: events.emailChanged }}
            />
          </div>
        </div>
        <div class='field'>
          <div class='control'>
            <button class='button' type='submit'>
              <span class='icon'>
                <i class='fa-duotone fa-solid fa-key' />
              </span>
              <span>Register Passkey</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
