import { jsx } from '@worldmaker/butterfloat'
import { map, Observable } from 'rxjs'

export interface UserProps {
  email: Observable<string | null>
  url: string | null
}

export default function User({ email, url }: UserProps) {
  return (
    <a
      class='navbar-item'
      href={url ?? '/passkey'}
      bind={{ innerText: email.pipe(map((e) => e ?? '…')) }}
    >
    </a>
  )
}
