import { jsx } from '@worldmaker/butterfloat'

export default function InviteRegistrationFormSkeleton() {
  return (
    <section class='section'>
      <h1 class='title'>Register with Invite</h1>
      <p>Register with an invite code:</p>

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
