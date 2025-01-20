import { Fragment, jsx } from '@worldmaker/butterfloat'

export function Skeleton() {
  return (
    <>
      <div class='field'>
        <label class='label' for='email'>Email</label>
        <div class='control'>
          <input
            id='email'
            name='email'
            class='input is-skeleton'
            type='email'
            autocomplete='username webauthn'
          />
        </div>
      </div>
      <div class='field'>
        <div class='control'>
          <button class='button is-primary is-skeleton'>
            Login
          </button>
        </div>
      </div>
    </>
  )
}
