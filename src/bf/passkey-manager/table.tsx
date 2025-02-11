import { jsx } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { PasskeysVm } from './vm.ts'
import { filter, from } from 'rxjs'
import { map } from 'rxjs'
import { Row } from './row.tsx'
import { switchMap } from 'rxjs'

export interface TableProps {
  session: Session
}

export function Table({ session }: TableProps) {
  const vm = new PasskeysVm(session)
  return (
    <table class='table is-striped'>
      <thead>
        <tr>
          <th>ID</th>
          <th></th>
          <th>Nickname/Comments</th>
          <th>Details</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody childrenBind={vm.passkeys.pipe(filter(keys => keys.length > 0), switchMap(keys => from(keys)), map((passkey) => () => <Row vm={passkey} />))} />
    </table>
  )

}
