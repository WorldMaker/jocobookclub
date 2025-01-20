import { jsx } from '@worldmaker/butterfloat'

export function Success() {
  return (
    <div class='notification is-success'>
      You have successfully logged in.{' '}
      <a href='../'>You can now update your current ballot.</a>
    </div>
  )
}
