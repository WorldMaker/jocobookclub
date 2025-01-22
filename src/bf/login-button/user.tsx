import { jsx } from '@worldmaker/butterfloat'
import { map, Observable } from 'rxjs'

export interface UserProps {
  email: Observable<string | null>
  url: string | null
}

export default function User({ email, url }: UserProps) {
  return (
    <a
      class='navbar-item icon-text'
      href={url ?? '/passkey'}
    >
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-user-astronaut'></i>
      </span>
      <span bind={{ innerText: email.pipe(map((e) => e ?? '…')) }}></span>
    </a>
  )
}
