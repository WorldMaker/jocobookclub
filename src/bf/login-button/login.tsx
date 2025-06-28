import { jsx } from '@worldmaker/butterfloat'
import type { Observable } from 'rxjs'

interface LoginProps {
  url: string | null
  active: Observable<boolean>
}

export default function Login({ url, active }: LoginProps) {
  return (
    <a
      class='navbar-item icon-text'
      href={url ?? '/login'}
      classBind={{
        'has-text-info': active,
        'has-background-dark': active,
      }}
    >
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-ferry' />
      </span>
      <span>Login</span>
    </a>
  )
}
