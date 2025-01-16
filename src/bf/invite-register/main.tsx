/// <reference lib="dom" />
import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import { Invite } from '@worldmaker/jocobookclub-api/models'
import { defer, map } from 'rxjs'
import { apiClient } from '../client.ts'
import { SessionManager } from '../vm/session-manager.ts'
import { combineLatest, concat, of, Subscription } from 'rxjs'
import AlreadyLoggedIn from './logged-in.tsx'
import InvalidInvite from './invalid-invite.tsx'
import InviteRegistrationFormSkeleton from './skeleton.tsx'
import InviteRegistrationForm from './form.tsx'

function InviteRegister() {
  const sessionManager = new SessionManager()
  const inviteCode = location.hash.slice(1)
  const invite = concat(
    of({ loading: true, data: null }),
    defer(async () => {
      if (!inviteCode || inviteCode.length < 5) {
        return { loading: false, data: null }
      }
      const response = await apiClient.invite[':invite'].$get({
        param: { invite: inviteCode },
      })
      if (response.ok) {
        const maybeInvite = await response.json()
        const invite = Invite.safeParse(maybeInvite)
        if (invite.success) {
          return { loading: false, data: invite.data }
        }
      }
      return { loading: false, data: null }
    }),
  )
  const children = combineLatest([sessionManager.session, invite]).pipe(
    map(([session, invite]) => {
      if (session) {
        return AlreadyLoggedIn
      }
      if (invite.loading) {
        return InviteRegistrationFormSkeleton
      }
      if (!invite.data) {
        return InvalidInvite
      }
      return () => <InviteRegistrationForm invite={invite.data} />
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class InviteRegisterComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, InviteRegister)
  }

  disconnectedCallback() {
    if (this.#subscription) {
      this.#subscription.unsubscribe()
    }
  }
}

customElements.define('invite-register', InviteRegisterComponent)

export default InviteRegisterComponent
