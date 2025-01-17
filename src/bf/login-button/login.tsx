import { jsx } from '@worldmaker/butterfloat'

interface LoginProps {
  url: string | null
}

export default function Login({ url }: LoginProps) {
  return <a class='navbar-item' href={url ?? '/login'}>Login</a>
}
