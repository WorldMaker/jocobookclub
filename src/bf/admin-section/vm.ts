import { Session } from '@worldmaker/jocobookclub-api/models'
import { apiClient } from '../client.ts'

export class AdminVm {
  readonly #session: Session

  constructor(session: Session) {
    this.#session = session
  }

  async recount() {
    await apiClient.admin.recount.$post({}, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
  }
}
