import { jsx } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { PasskeysVm } from './vm.ts'
import { filter, from } from 'rxjs'
import { map } from 'rxjs'
import { Key } from './key.tsx'
import { switchMap } from 'rxjs'

export interface ListProps {
  session: Session
}

export function List({ session }: ListProps) {
  const vm = new PasskeysVm(session)
  return (
    <div
      childrenBind={vm.passkeys.pipe(
        filter((keys) => keys.length > 0),
        switchMap((keys) => from(keys)),
        map((passkey) => () => <Key vm={passkey} />),
      )}
    />
  )
}
