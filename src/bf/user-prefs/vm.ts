import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { Session, UserInfo } from '@worldmaker/jocobookclub-api/models'
import { map, Observable, shareReplay } from 'rxjs'
import { apiClient } from '../client.ts'

export class UserPrefsManager {
  readonly #session: Session

  readonly #prefs: Observable<UserInfo | null>
  readonly #setPrefs: (prefs: StateSetter<UserInfo | null>) => void
  get prefs() {
    return this.#prefs
  }

  readonly #unsaved: Observable<boolean>
  get unsaved() {
    return this.#unsaved
  }

  // for 3-way merge, the last known saved prefs
  #lastPrefs: UserInfo | null = null

  constructor(session: Session) {
    this.#session = session

    ;[this.#prefs, this.#setPrefs] = butterfly<UserInfo | null>(null)

    this.#unsaved = this.#prefs.pipe(
      map((prefs) => {
        if (!prefs) {
          return false
        }
        if (!this.#lastPrefs) {
          return true
        }
        return prefs.canEmail !== this.#lastPrefs.canEmail
          || prefs.preferredName !== this.#lastPrefs.preferredName
      }),
      shareReplay(1),
    )

    const maybePrefs = localStorage.getItem(`user-prefs/${session.userId}`)
    if (maybePrefs) {
      const prefs = UserInfo.safeParse(JSON.parse(maybePrefs))
      if (prefs.success) {
        this.#setPrefs(prefs.data)
      }
    }
    const maybeLastPrefs = localStorage.getItem(`saved/user-prefs/${session.userId}`)
    if (maybeLastPrefs) {
      const lastPrefs = UserInfo.safeParse(JSON.parse(maybeLastPrefs))
      if (lastPrefs.success) {
        this.#lastPrefs = lastPrefs.data
      }
    }
    this.load()
  }

  async load() {
    const response = await apiClient.user.$get({
      headers: {
        Authorization: `Bearer ${this.#session.token}`
      }
    })
    if (response.ok) {
      const remotePrefs = await response.json()
      this.#updatePrefs((localPrefs) => {
        const newPrefs = structuredClone(remotePrefs)
        if (localPrefs && this.#lastPrefs) {
          if (localPrefs.canEmail !== this.#lastPrefs.canEmail) {
            newPrefs.canEmail = localPrefs.canEmail
          }
          if (localPrefs.preferredName !== this.#lastPrefs.preferredName) {
            newPrefs.preferredName = localPrefs.preferredName
          }
        }
        return newPrefs
      })
      this.#updateLastPrefs(remotePrefs)
    }
  }

  #updatePrefs(prefs: StateSetter<UserInfo | null>) {
    this.#setPrefs((currentPrefs) => {
      const updatedPrefs = typeof prefs === 'function' ? prefs(currentPrefs) : prefs
      localStorage.setItem(`user-prefs/${this.#session.userId}`, JSON.stringify(updatedPrefs))
      return updatedPrefs
    })
  }

  #updateLastPrefs(prefs: UserInfo) {
    this.#lastPrefs = structuredClone(prefs)
    localStorage.setItem(`saved/user-prefs/${this.#session.userId}`, JSON.stringify(prefs))
  }
}
