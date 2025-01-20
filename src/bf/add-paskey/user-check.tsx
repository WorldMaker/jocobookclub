import { jsx } from '@worldmaker/butterfloat'

export interface UserCheckProps {
  backedup: boolean
  multiDevice: boolean
}

export function UserCheck({ backedup, multiDevice }: UserCheckProps) {
  return (
    <div class='notification is-warning'>
      Passkey added successfully, but:
      {backedup ? '' : 'The Passkey claims to not be backed up.'}
      {multiDevice
        ? ''
        : ' The Passkey claims it is not available for multi-device use.'}
      You may want to <a href='../passkey'>add another Passkey</a>{' '}
      that is. Otherwise, <a href='../'>check out the current ballot</a>.
    </div>
  )
}
