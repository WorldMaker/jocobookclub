import { jsx } from '@worldmaker/butterfloat'

export interface UserProps {
  email: string
}

export default function User({ email }: UserProps) {
  return <a class='navbar-item' href="/passkey">{email}</a>
}
