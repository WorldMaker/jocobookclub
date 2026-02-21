import { ComponentContext, Fragment, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { Invite, Session } from '@worldmaker/jocobookclub-api/models'
import { filter, from, map, switchMap, takeUntil } from 'rxjs'
import { Key } from './key.tsx'
import { PasskeysVm } from './vm.ts'

export interface ListProps {
  session: Session
}

interface InviteViewProps {
  invite: Invite
}

interface InviteEvents {
  close: ObservableEvent<MouseEvent>
}

function InviteView(
  { invite }: InviteViewProps,
  { bindEffect, events }: ComponentContext<InviteEvents>,
) {
  const inviteUrl =
    `https://worldmaker.net/jocobookclub/invite-register/#${invite.id}`

  bindEffect(events.close.pipe(takeUntil(events.close)), () => {})

  if (invite.type !== 'specific-email') {
    return (
      <div class='block notification is-danger'>
        <p>Error creating invite: unexpected invite type</p>
      </div>
    )
  }

  return (
    <div class='block notification is-primary'>
      <button
        type='button'
        class='delete'
        title='Close'
        events={{ click: events.close }}
      />
      Created link to add a new Passkey:{' '}
      <a href={inviteUrl} target='_blank'>
        <code>{inviteUrl}</code>
      </a>{' '}
      for the account with email:{' '}
      <a href={`mailto:${invite.email}`}>
        <code>{invite.email}</code>
      </a>
    </div>
  )
}

interface ListEvents {
  click: ObservableEvent<MouseEvent>
}

export function List({ session }: ListProps, { bindEffect,events }: ComponentContext<ListEvents>) {
  const vm = new PasskeysVm(session)
  const inviteView = vm.invite.pipe(
    map((invite) => () => <InviteView invite={invite} />),
  )
  bindEffect(events.click, () => vm.createPasskeyInvite())
  return <>
    <div class='block'>
      <div childrenBind={inviteView} childrenBindMode='append' />
      <button type='button' class='button is-primary' events={{ click: events.click }}>
        <span class='icon'>
          <i class='fa-duotone fa-solid fa-key'></i>
        </span>{' '}
        <span>Create Link to Add Passkey to Your Account</span>
      </button>
      <p>Build a link that you can send to another device to add a Passkey to your account.
        Send the link any way you feel comfortable securely sending links to your other
        devices.
      </p>
    </div>
    <div
      class='block'
      childrenBind={vm.passkeys.pipe(
        filter((keys) => keys.length > 0),
        switchMap((keys) => from(keys)),
        map((passkey) => () => <Key vm={passkey} />),
      )}
    />
  </>
}
