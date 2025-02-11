import { jsx } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { map, Observable } from 'rxjs'

export interface UserProps {
  email: Observable<string | null>
  session: Observable<Session | null>
  url: string | null
}

export default function User({ email, session, url }: UserProps) {
  const admin = session.pipe(map((session) => session?.admin ?? false))
  const notAdmin = admin.pipe(map((admin) => !admin))
  return (
    <a
      class='navbar-item icon-text'
      href={url ?? '/passkey'}
    >
      <span class='icon'>
        <i
          class='fa-duotone fa-solid'
          classBind={{ 'fa-user-astronaut': notAdmin, 'fa-user-visor': admin }}
        >
        </i>
      </span>
      <span bind={{ innerText: email.pipe(map((e) => e ?? '…')) }}></span>
    </a>
  )
}
