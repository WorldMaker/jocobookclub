import { jsx } from '@worldmaker/butterfloat'

interface LoginProps {
  url: string | null
  active: boolean
}

export default function Login({ url, active }: LoginProps) {
  return (
    <a class={ active ? 'navbar-item icon-text has-background-dark has-text-info' : 'navbar-item icon-text' } href={url ?? '/login'}>
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-ferry' />
      </span>
      <span>Login</span>
    </a>
  )
}
