import {
  RegistrationResponseJSON,
  startRegistration,
} from '@simplewebauthn/browser'
import { butterfly } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { combineLatest, map, Observable } from 'rxjs'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

export type RegistrationState =
  | { type: 'success' }
  | { type: 'error'; error: unknown }
  | { type: 'busy' }
  | { type: 'user-check'; backedup: boolean; multiDevice: boolean }
  | { type: 'session-error' }
  | { type: 'verification-error' }

export type AddPasskeyState =
  | RegistrationState
  | { type: 'ready'; session: Session }
  | { type: 'logged-out' }

export class RegistrationVm {
  #sessionState: Observable<AddPasskeyState>

  #state: Observable<RegistrationState>
  #setState: (state: RegistrationState) => void
  get state() {
    return combineLatest([this.#sessionState, this.#state]).pipe(
      map(([sessionState, state]) => {
        if (sessionState.type === 'logged-out') {
          return sessionState
        }
        if (sessionState.type === 'ready' && state.type === 'busy') {
          return sessionState
        }
        return state
      }),
    )
  }

  constructor() {
    ;[this.#state, this.#setState] = butterfly<RegistrationState>({
      type: 'busy',
    })

    this.#sessionState = sessionManager.session.pipe(
      map((session) => {
        if (!session) {
          return { type: 'logged-out' }
        }
        return { type: 'ready', session }
      }),
    )
  }

  async register(session: Session) {
    this.#setState({ type: 'busy' })
    const resp = await apiClient.user['register-options'].$get({}, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    if (!resp.ok) {
      this.#setState({ type: 'session-error' })
      return
    }
    const options = await resp.json()

    let attResp: RegistrationResponseJSON | null = null
    try {
      attResp = await startRegistration({ optionsJSON: options })
    } catch (error) {
      this.#setState({ type: 'error', error })
      return
    }

    const verificationResp = await apiClient.user['register-verify'].$post({
      json: attResp,
    }, { headers: { Authorization: `Bearer ${session.token}` } })
    if (!verificationResp.ok) {
      this.#setState({ type: 'verification-error' })
      return
    }

    const verification = await verificationResp.json()
    if (!verification.verification.verified) {
      console.error(verification.verification)
      this.#setState({ type: 'verification-error' })
      return
    }

    const backedup =
      verification.verification.registrationInfo?.credentialBackedUp ?? false
    const multiDevice =
      verification.verification.registrationInfo?.credentialDeviceType ===
        'multiDevice'
    if (!backedup || !multiDevice) {
      this.#setState({ type: 'user-check', backedup, multiDevice })
      return
    }

    this.#setState({ type: 'success' })
  }
}
