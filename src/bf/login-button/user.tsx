import { jsx } from '@worldmaker/butterfloat'
import { map, Observable } from 'rxjs'

export interface UserProps {
  email: Observable<string | null>
}

export default function User({ email }: UserProps) {
  return (
    <a
      class='navbar-item'
      href='/passkey'
      bind={{ innerText: email.pipe(map((e) => e ?? '…')) }}
    >
    </a>
  )
}
