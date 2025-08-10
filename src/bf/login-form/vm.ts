import {
  AuthenticationResponseJSON,
  startAuthentication,
} from '@simplewebauthn/browser'
import { butterfly } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { firstValueFrom, Observable } from 'rxjs'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

export type LoginFormState =
  | { type: 'idle' }
  | { type: 'busy' }
  | { type: 'error' }
  | { type: 'success' }

export class LoginFormVm {
  #state: Observable<LoginFormState>
  #setState: (state: LoginFormState) => void
  get state() {
    return this.#state
  }

  #email: Observable<string>
  #setEmail: (email: string) => void
  get email() {
    return this.#email
  }

  constructor() {
    ;[this.#state, this.#setState] = butterfly<LoginFormState>({ type: 'idle' })
    ;[this.#email, this.#setEmail] = butterfly<string>('')
  }

  emailChanged(email: string | null) {
    this.#setEmail(email ?? '')
  }

  async login() {
    this.#setState({ type: 'busy' })
    const email = await firstValueFrom(this.email)
    this.loginWithEmail(email)
  }

  async loginWithEmail(email: string) {
    this.#setState({ type: 'busy' })
    const resp = await apiClient.login['auth-options'].$get({
      query: { email },
    })
    if (!resp.ok) {
      this.#setState({ type: 'error' })
      return
    }
    const optionsJSON = await resp.json()

    let asseResp: AuthenticationResponseJSON | null = null
    try {
      asseResp = await startAuthentication({ optionsJSON })
    } catch (e) {
      console.error(e)
      this.#setState({ type: 'error' })
      return
    }

    const verificationResp = await apiClient.login.verify.$post({
      json: { email, ...asseResp },
    })
    if (!verificationResp.ok) {
      this.#setState({ type: 'error' })
      return
    }
    const verification = await verificationResp.json()

    if (!verification.verification.verified) {
      this.#setState({ type: 'error' })
      return
    }

    const session = Session.safeParse(verification.session)
    if (!session.success) {
      console.error(session.error)
      this.#setState({ type: 'error' })
      return
    }
    sessionManager.started(session.data, email)

    this.#setState({ type: 'success' })
  }
}
