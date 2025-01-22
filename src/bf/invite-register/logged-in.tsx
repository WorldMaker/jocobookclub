import { jsx } from '@worldmaker/butterfloat'

export default function AlreadyLoggedIn() {
  return (
    <section class='section'>
      <h1 class='title'>Already Logged In</h1>
      <p>
        You are already logged in. Are you looking to{' '}
        <a href='../passkey'>add a new passkey</a> or for the{' '}
        <a href='../#ballot'>current ballot</a>?
      </p>
    </section>
  )
}
