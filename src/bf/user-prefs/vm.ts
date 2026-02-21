import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import {
  getUserPreferredEmail,
  Session,
  UserInfo,
} from '@worldmaker/jocobookclub-api/models'
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs'
import { apiClient } from '../client.ts'
import { ZodSafeParseResult } from 'zod'
import sessionManager from '../vm/session-manager.ts'

export class UserPrefsManager {
  readonly #session: Session

  readonly #prefs: Observable<UserInfo | null>
  readonly #setPrefs: (prefs: StateSetter<UserInfo | null>) => void
  get prefs() {
    return this.#prefs
  }

  readonly #previewEmail: Observable<string | null>
  get previewEmail() {
    return this.#previewEmail
  }

  readonly #unsaved: Observable<boolean>
  get unsaved() {
    return this.#unsaved
  }
  readonly #valid: Observable<ZodSafeParseResult<UserInfo>>
  get valid() {
    return this.#valid
  }

  // for 3-way merge, the last known saved prefs
  #lastPrefs: UserInfo | null = null

  constructor(session: Session) {
    this.#session = session
    ;[this.#prefs, this.#setPrefs] = butterfly<UserInfo | null>(null)

    this.#previewEmail = this.#prefs.pipe(
      map((prefs) => {
        if (!prefs || !prefs.canEmail) {
          return null
        }
        return getUserPreferredEmail(prefs)
      }),
      shareReplay(1),
    )

    this.#unsaved = this.#prefs.pipe(
      map((prefs) => {
        if (!prefs) {
          return false
        }
        if (!this.#lastPrefs) {
          return true
        }
        return prefs.canEmail !== this.#lastPrefs.canEmail ||
          prefs.preferredName !== this.#lastPrefs.preferredName ||
          prefs.canDiscordDm !== this.#lastPrefs.canDiscordDm ||
          prefs.discordHandle !== this.#lastPrefs.discordHandle
      }),
      shareReplay(1),
    )

    this.#valid = this.#prefs.pipe(
      map((prefs) => UserInfo.safeParse(prefs)),
      shareReplay(1),
    )

    const maybePrefs = localStorage.getItem(`user-prefs/${session.userId}`)
    if (maybePrefs) {
      const prefs = UserInfo.safeParse(JSON.parse(maybePrefs))
      if (prefs.success) {
        this.#setPrefs(prefs.data)
      }
    }
    const maybeLastPrefs = localStorage.getItem(
      `saved/user-prefs/${session.userId}`,
    )
    if (maybeLastPrefs) {
      const lastPrefs = UserInfo.safeParse(JSON.parse(maybeLastPrefs))
      if (lastPrefs.success) {
        this.#lastPrefs = lastPrefs.data
      }
    }
    this.load()
  }

  async load() {
    const response = await apiClient.user.$get({}, {
      headers: {
        Authorization: `Bearer ${this.#session.token}`,
      },
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
          if (localPrefs.canDiscordDm !== this.#lastPrefs.canDiscordDm) {
            newPrefs.canDiscordDm = localPrefs.canDiscordDm
          }
          if (localPrefs.discordHandle !== this.#lastPrefs.discordHandle) {
            newPrefs.discordHandle = localPrefs.discordHandle
          }
        }
        return newPrefs
      })
      this.#updateLastPrefs(remotePrefs)
    } else {
      const email = await firstValueFrom(sessionManager.email)
      if (email) {
        this.#updatePrefs((currentPrefs) =>
          currentPrefs ? currentPrefs : { email }
        )
      }
    }
  }

  async save() {
    const prefs = await firstValueFrom(this.#prefs)
    if (!prefs) {
      return
    }
    const valid = UserInfo.safeParse(prefs)
    if (!valid.success) {
      return
    }
    const updated = await apiClient.user.$patch({
      json: valid.data,
    }, {
      headers: {
        Authorization: `Bearer ${this.#session.token}`,
      },
    })
    if (!updated.ok) {
      return
    }
    this.#updateLastPrefs(prefs)
    this.#updatePrefs(prefs)
  }

  #updatePrefs(prefs: StateSetter<UserInfo | null>) {
    this.#setPrefs((currentPrefs) => {
      const updatedPrefs = typeof prefs === 'function'
        ? prefs(currentPrefs)
        : prefs
      localStorage.setItem(
        `user-prefs/${this.#session.userId}`,
        JSON.stringify(updatedPrefs),
      )
      return updatedPrefs
    })
  }

  #updateLastPrefs(prefs: UserInfo) {
    this.#lastPrefs = structuredClone(prefs)
    localStorage.setItem(
      `saved/user-prefs/${this.#session.userId}`,
      JSON.stringify(prefs),
    )
  }

  canEmailChanged(canEmail: boolean) {
    this.#updatePrefs((currentPrefs) => {
      if (!currentPrefs) {
        return null
      }
      return { ...currentPrefs, canEmail }
    })
  }

  preferredNameChanged(preferredName: string) {
    this.#updatePrefs((currentPrefs) => {
      if (!currentPrefs) {
        return null
      }
      return { ...currentPrefs, preferredName }
    })
  }

  canDiscordDmChanged(canDiscordDm: boolean) {
    this.#updatePrefs((currentPrefs) => {
      if (!currentPrefs) {
        return null
      }
      return { ...currentPrefs, canDiscordDm }
    })
  }

  discordHandleChanged(discordHandle: string) {
    this.#updatePrefs((currentPrefs) => {
      if (!currentPrefs) {
        return null
      }
      return { ...currentPrefs, discordHandle }
    })
  }
}
