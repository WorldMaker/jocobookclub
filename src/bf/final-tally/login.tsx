import { jsx } from '@worldmaker/butterfloat'

export function Login() {
  return (
    <p>
      You need to <a href='../login'>login</a>{' '}
      to view the current ranking. You may also browse{' '}
      <a href='../history/'>past rankings</a> without logging in.
    </p>
  )
}

export function LoginTop5() {
  return (
    <p>
      You need to <a href='./login'>login</a>{' '}
      to view the current ranking. You may also browse{' '}
      <a href='./history/'>past rankings</a> without logging in.
    </p>
  )
}
