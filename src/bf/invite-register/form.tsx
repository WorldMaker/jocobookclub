import { jsx } from '@worldmaker/butterfloat'
import { Invite } from '@worldmaker/jocobookclub-api/models'

interface InviteRegistrationFormProps {
  invite: Invite
}

export default function InviteRegistrationForm(
  { invite }: InviteRegistrationFormProps,
) {
  return (
    <section class='section'>
      <h1 class='title'>Register with Invite</h1>
      <p>
        Register with a Passkey. <strong>TIP:</strong>{' '}
        Best results may be to login first on iOS or Android.
      </p>

      <div class='field'>
        <label class='label' for='email'>Email</label>
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
          <button class='button' type='submit'>Register Passkey</button>
        </div>
      </div>
    </section>
  )
}
