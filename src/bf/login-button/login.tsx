import { jsx } from '@worldmaker/butterfloat'

interface LoginProps {
  url: string | null
}

export default function Login({ url }: LoginProps) {
  return (
    <a class='navbar-item icon-text' href={url ?? '/login'}>
      <span class='icon'>
        <i class='fa-duotone fa-solid fa-ferry' />
      </span>
      <span>Login</span>
    </a>
  )
}
