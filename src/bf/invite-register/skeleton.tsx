import { jsx } from '@worldmaker/butterfloat'

export default function InviteRegistrationFormSkeleton() {
  return (
    <section class='section'>
      <h1 class='title'>Register</h1>
      <p>
        Register with a Passkey. <strong>TIP:</strong>{' '}
        Passkeys from iOS or Android are easier to use on Windows{' '}
        than the other way around, in many cases.
      </p>

      <div className='field'>
        <label class='label' for='email'>Email</label>
        <div className='control'>
          <input
            type='text'
            class='input is-skeleton'
            id='email'
            name='email'
            required
            autocomplete='username'
            disabled
          />
        </div>
      </div>
      <div class='field'>
        <div class='control'>
          <button type='submit' class='button is-skeleton'>
            Register Passkey
          </button>
        </div>
      </div>
    </section>
  )
}
