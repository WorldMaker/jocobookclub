import { Invite, Session } from '@worldmaker/jocobookclub-api/models'
import { apiClient } from '../client.ts'
import { ulid } from '@std/ulid'
import { firstValueFrom, Observable } from 'rxjs'
import { butterfly, StateSetter } from '@worldmaker/butterfloat'

export class AdminVm {
  readonly #session: Session

  readonly #invite: Observable<Invite | null>
  readonly #setInvite: (url: StateSetter<Invite | null>) => void
  get invite() {
    return this.#invite
  }

  readonly #inviteRequestEmail: Observable<string | null>
  readonly #setInviteRequestEmail: (email: StateSetter<string | null>) => void
  get inviteRequestEmail() {
    return this.#inviteRequestEmail
  }

  constructor(session: Session) {
    this.#session = session
    ;[this.#invite, this.#setInvite] = butterfly<Invite | null>(null)
    ;[this.#inviteRequestEmail, this.#setInviteRequestEmail] = butterfly<
      string | null
    >(null)
  }

  async createOpenInvite() {
    const inviteId = ulid()
    const invite: Invite = {
      id: inviteId,
      type: 'open-enrollment',
    }
    const result = await apiClient.admin.invite[':inviteId'].$put({
      param: { inviteId },
      json: invite,
    }, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
    if (result.ok) {
      const resultInvite = await result.json()
      this.#setInvite(
        resultInvite,
      )
    } else {
      this.#setInvite(null)
    }
  }

  async createEmailInvite() {
    const inviteId = ulid()
    const email = await firstValueFrom(this.#inviteRequestEmail)
    if (!email) {
      return
    }
    const invite: Invite = {
      id: inviteId,
      type: 'specific-email',
      email,
    }
    const result = await apiClient.admin.invite[':inviteId'].$put({
      param: { inviteId },
      json: invite,
    }, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
    if (result.ok) {
      const resultInvite = await result.json()
      this.#setInvite(
        resultInvite,
      )
    } else {
      this.#setInvite(null)
    }
  }

  emailChanged(email: string) {
    this.#setInviteRequestEmail(email)
  }

  async recount() {
    await apiClient.admin.recount.$post({}, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
  }
}
