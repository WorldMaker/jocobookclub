import { Passkey, Session } from '@worldmaker/jocobookclub-api/models'
import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs'
import { apiClient } from '../client.ts'

export class PasskeyVm {
  readonly #session: Session
  get admin() {
    return this.#session.admin
  }
  readonly #passkey: Observable<Passkey>
  get passkey() {
    return this.#passkey
  }
  readonly #setPasskey: (passkey: StateSetter<Passkey>) => void
  #savedPasskey: Passkey
  readonly #unsaved: Observable<boolean>
  get unsaved() {
    return this.#unsaved
  }
  readonly #deleted: Observable<boolean>
  readonly #setDeleted: (deleted: StateSetter<boolean>) => void
  get deleted() {
    return this.#deleted
  }
  readonly #lastAdminKey: Observable<boolean>
  readonly #lastKey: Observable<boolean>

  constructor(
    session: Session,
    passkey: Passkey,
    lastKey: Observable<boolean>,
    lastAdminKey: Observable<boolean>,
  ) {
    this.#session = session
    ;[this.#passkey, this.#setPasskey] = butterfly(structuredClone(passkey))
    this.#savedPasskey = structuredClone(passkey)
    ;[this.#deleted, this.#setDeleted] = butterfly(false)
    this.#lastKey = lastKey
    this.#lastAdminKey = lastAdminKey

    this.#unsaved = this.passkey.pipe(
      map((passkey) =>
        passkey.admin !== this.#savedPasskey.admin ||
        passkey.nickname !== this.#savedPasskey.nickname
      ),
      shareReplay(1),
    )
  }

  async save() {
    const passkey = await firstValueFrom(this.passkey)
    const result = await apiClient.user.passkey[':id'].$patch({
      param: { id: passkey.id },
      json: { admin: this.admin && passkey.admin, nickname: passkey.nickname },
    })
    if (result.ok) {
      const saved = await result.json() as Passkey
      this.#savedPasskey = saved
    }
  }

  async delete() {
    if (await firstValueFrom(this.#lastKey)) {
      return
    }
    const passkey = await firstValueFrom(this.passkey)
    if (passkey.admin) {
      return
    }
    const result = await apiClient.user.passkey[':id'].$delete({
      param: { id: passkey.id },
    })
    if (result.ok) {
      this.#setDeleted(true)
    }
  }

  async toggleAdmin() {
    if (this.admin && !await firstValueFrom(this.#lastAdminKey)) {
      this.#setPasskey((passkey) => ({ ...passkey, admin: !passkey.admin }))
    }
  }

  updateNickname(nickname: string) {
    this.#setPasskey((passkey) => ({ ...passkey, nickname }))
  }
}
