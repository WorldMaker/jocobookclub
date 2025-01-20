import { jsx } from '@worldmaker/butterfloat'

interface ErrorProps {
  error: unknown
}

export function RegistrationError({ error }: ErrorProps) {
  return <div class='notification is-danger'>{ typeof error === 'object' && error && 'name' in error && error.name === 'InvalidStateError' ? 'The Passkey may have already been registered to this account' : `An error occured trying to register the Passkey: ${error}` }</div>
}
