import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import {
  Invite,
  PasskeyMeta,
  Session,
} from '@worldmaker/jocobookclub-api/models'
import {
  combineLatest,
  combineLatestAll,
  firstValueFrom,
  from,
  map,
  Observable,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs'
import { apiClient } from '../client.ts'

export class PasskeyVm {
  readonly #session: Session
  get session() {
    return this.#session
  }
  get admin() {
    return this.#session.admin
  }
  readonly #basePasskey: PasskeyMeta
  get basePasskey() {
    return this.#basePasskey
  }
  readonly #passkey: Observable<PasskeyMeta>
  get passkey() {
    return this.#passkey
  }
  readonly #setPasskey: (passkey: StateSetter<PasskeyMeta>) => void
  #savedPasskey: PasskeyMeta
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
  get lastAdminKey() {
    return this.#lastAdminKey
  }
  readonly #lastKey: Observable<boolean>
  get lastKey() {
    return this.#lastKey
  }

  constructor(
    session: Session,
    passkey: PasskeyMeta,
    lastKey: Observable<boolean>,
    lastAdminKey: Observable<boolean>,
  ) {
    this.#session = session
    this.#basePasskey = structuredClone(passkey)
    ;[this.#passkey, this.#setPasskey] = butterfly(structuredClone(passkey))
    this.#savedPasskey = structuredClone(passkey)
    ;[this.#deleted, this.#setDeleted] = butterfly(false)
    this.#lastKey = lastKey

    this.#unsaved = this.passkey.pipe(
      map((passkey) =>
        passkey.admin !== this.#savedPasskey.admin ||
        passkey.nickname !== this.#savedPasskey.nickname
      ),
      shareReplay(1),
    )
    this.#lastAdminKey = combineLatest([lastAdminKey, this.passkey]).pipe(
      map(([lastAdminKey, passkey]) => Boolean(lastAdminKey && passkey.admin)),
    )
  }

  async save() {
    const passkey = await firstValueFrom(this.passkey)
    const result = await apiClient.user.passkey[':id'].$patch({
      param: { id: passkey.id },
      json: { admin: this.admin && passkey.admin, nickname: passkey.nickname },
    }, { headers: { 'Authorization': `Bearer ${this.#session.token}` } })
    if (result.ok) {
      const saved = await result.json()
      this.#savedPasskey = structuredClone(saved)
      this.#setPasskey(structuredClone(saved))
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

export class PasskeysVm {
  readonly #session: Session
  readonly #passkeys: Observable<PasskeyVm[]>
  get passkeys() {
    return this.#passkeys
  }
  readonly #setPasskeys: (passkeys: StateSetter<PasskeyVm[]>) => void
  readonly #lastKey: Observable<boolean>
  readonly #lastAdminKey: Observable<boolean>

  readonly #invite = new Subject<Invite>()
  #setInvite(invite: Invite) {
    this.#invite.next(invite)
  }
  get invite() {
    return this.#invite
  }

  constructor(session: Session) {
    this.#session = session
    ;[this.#passkeys, this.#setPasskeys] = butterfly<PasskeyVm[]>([])
    this.#lastKey = this.#passkeys.pipe(
      switchMap((passkeys) =>
        from(passkeys.map((passkey) => passkey.deleted)).pipe(
          combineLatestAll(),
        )
      ),
      // count the number that are not deleted
      map((deleted) => deleted.reduce((acc, d) => acc + (d ? 0 : 1), 0)),
      map((keys) => keys <= 1),
      shareReplay(1),
    )
    this.#lastAdminKey = this.#passkeys.pipe(
      switchMap((passkeys) =>
        from(passkeys.map((passkey) => passkey.passkey)).pipe(
          combineLatestAll(),
        )
      ),
      // count the number that are admin
      map((passkeys) =>
        passkeys.reduce((acc, p) => acc + (p.admin ? 1 : 0), 0)
      ),
      map((keys) => keys <= 1),
      shareReplay(1),
    )
    this.load()
  }

  async load() {
    const result = await apiClient.user.passkey.$get({}, {
      headers: { 'Authorization': `Bearer ${this.#session.token}` },
    })
    if (!result.ok) {
      return
    }

    const passkeys = await result.json()
    this.#setPasskeys(() =>
      passkeys.map((passkey) =>
        new PasskeyVm(this.#session, passkey, this.#lastKey, this.#lastAdminKey)
      )
    )
  }

  async createPasskeyInvite() {
    const result = await apiClient.user['passkey-invite'].$post({}, {
      headers: { 'Authorization': `Bearer ${this.#session.token}` },
    })
    if (!result.ok) {
      return
    }
    const invite = await result.json()
    this.#setInvite(invite)
  }
}
