import {
  ComponentContext,
  Empty,
  Fragment,
  jsx,
  ObservableEvent,
  run,
} from '@worldmaker/butterfloat'
import { Invite } from '@worldmaker/jocobookclub-api/models'
import { map, Subscription, takeUntil } from 'rxjs'
import sessionManager from '../vm/session-manager.ts'
import { AdminVm } from './vm.ts'

interface AdminProps {
  vm: AdminVm
}

interface AdminEvents {
  createEmailInvite: ObservableEvent<SubmitEvent>
  createOpenInvite: ObservableEvent<MouseEvent>
  emailChanged: ObservableEvent<KeyboardEvent>
  getOptInEmails: ObservableEvent<MouseEvent>
  recount: ObservableEvent<MouseEvent>
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

  if (invite.type === 'specific-email') {
    return (
      <div class='block notification is-primary'>
        <button
          type='button'
          class='delete'
          title='Close'
          events={{ click: events.close }}
        />
        Created invite link:{' '}
        <a href={inviteUrl}>
          <code>{inviteUrl}</code>
        </a>{' '}
        for email:{' '}
        <a href={`mailto:${invite.email}`}>
          <code>{invite.email}</code>
        </a>
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
      Created invite link:{' '}
      <a href={inviteUrl}>
        <code>{inviteUrl}</code>
      </a>{' '}
      for open enrollment.
    </div>
  )
}

function AdminSection(
  { vm }: AdminProps,
  { bindEffect, bindImmediateEffect, events }: ComponentContext<AdminEvents>,
) {
  bindImmediateEffect(events.createEmailInvite, (event) => {
    event.preventDefault()
    vm.createEmailInvite()
  })
  bindImmediateEffect(events.createOpenInvite, () => vm.createOpenInvite())
  bindImmediateEffect(events.emailChanged, (event) => {
    const email = (event.target as HTMLInputElement).value
    vm.emailChanged(email)
  })
  bindEffect(events.getOptInEmails, () => vm.getOptInEmails())
  bindEffect(events.recount, () => vm.recount())
  const inviteView = vm.invite.pipe(
    map((invite) => {
      if (!invite) {
        return Empty
      }
      return () => <InviteView invite={invite} />
    }),
  )
  const emailsView = vm.optInEmails.pipe(
    map((emails) => {
      if (!emails) {
        return Empty
      }
      return () => (
        <div class='field'>
          <label class='label'>Opt-In Emails</label>
          <textarea class='textarea' placeholder='Emails' readOnly>
            {emails}
          </textarea>
        </div>
      )
    }),
  )
  return (
    <section class='section'>
      <h1 class='title'>
        <span class='icon has-text-warning'>
          <i class='fa-duotone fa-solid fa-user-visor' />
        </span>{' '}
        Administration
      </h1>
      <div childrenBind={inviteView} childrenBindMode='append' />
      <p class='block'>
        An open invitation allows any email to be registered while it is valid
        (roughly 48 hours).
      </p>
      <button
        type='button'
        class='block button is-primary'
        events={{ click: events.createOpenInvite }}
      >
        Create New Open Invite
      </button>
      <p class='block'>
        An invite can be created for only a specific email address to register.
      </p>
      <form class='block' events={{ submit: events.createEmailInvite }}>
        <div class='field'>
          <label class='label'>Email</label>
          <div class='control'>
            <input
              class='input'
              type='email'
              placeholder='Enter email address'
              events={{ change: events.emailChanged }}
            />
          </div>
        </div>
        <div class='field'>
          <div class='control'>
            <button type='submit' class='button is-primary'>
              Create New Email Invite
            </button>
          </div>
        </div>
      </form>
      <p class='block'>
        Some JoCoNauts may have opted in to receive emails about the book club.
      </p>
      <div childrenBind={emailsView} childrenBindMode='replace' />
      <button
        type='button'
        class='block button is-info'
        events={{ click: events.getOptInEmails }}
      >
        Get Opt-In Emails
      </button>
      <p class='block'>
        When changes are made to the ballot (a new book is added, an existing
        book was moved to "Held", things like that) the ballots will all
        eventually get recounted as people vote on the new ballot. However, if
        you need to force a recount here's the button to do it:
      </p>
      <button
        type='button'
        class='block button is-warning'
        events={{ click: events.recount }}
      >
        Recount All Ballots!
      </button>
    </section>
  )
}

function AdminSectionLoader() {
  const children = sessionManager.session.pipe(
    map((session) => {
      if (session && session.admin) {
        return () => <AdminSection vm={new AdminVm(session)} />
      }
      return Empty
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class AdminSectionElement extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, AdminSectionLoader)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}
customElements.define('admin-section', AdminSectionElement)

export default AdminSectionElement
