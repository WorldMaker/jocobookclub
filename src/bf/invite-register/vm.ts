import {
  RegistrationResponseJSON,
  startRegistration,
} from '@simplewebauthn/browser'
import { butterfly } from '@worldmaker/butterfloat'
import { Invite, Session } from '@worldmaker/jocobookclub-api/models'
import { combineLatest, defer, firstValueFrom, map, Observable } from 'rxjs'
import { RegistrationState } from '../add-passkey/vm.ts'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

type InviteRegistrationState =
  | RegistrationState
  | { type: 'logged-in' }
  | { type: 'invalid-invite' }
  | { type: 'invited'; invite: Invite }

function createSessionToken() {
  // TODO: something smexier?
  return crypto.randomUUID()
}

export class RegistrationVm {
  #sessionAndInviteState: Observable<InviteRegistrationState>

  #state: Observable<RegistrationState>
  #setState: (state: RegistrationState) => void
  get state() {
    return combineLatest([this.#sessionAndInviteState, this.#state]).pipe(
      map(([sessionAndInviteState, state]) => {
        if (
          sessionAndInviteState.type === 'logged-in' ||
          sessionAndInviteState.type === 'invalid-invite'
        ) {
          return sessionAndInviteState
        }
        if (sessionAndInviteState.type === 'invited' && state.type === 'busy') {
          return sessionAndInviteState
        }
        return state
      }),
    )
  }

  #email: Observable<string>
  #setEmail: (email: string) => void
  get email() {
    return this.#email
  }

  constructor() {
    ;[this.#email, this.#setEmail] = butterfly<string>('')
    ;[this.#state, this.#setState] = butterfly<RegistrationState>({
      type: 'busy',
    })

    const inviteState = defer(async (): Promise<InviteRegistrationState> => {
      const inviteCode = location.hash.slice(1)
      if (!inviteCode || inviteCode.length < 5) {
        return { type: 'invalid-invite' }
      }
      const response = await apiClient.invite[':invite'].$get({
        param: { invite: inviteCode },
      })
      if (response.ok) {
        const maybeInvite = await response.json()
        const invite = Invite.safeParse(maybeInvite)
        if (invite.success) {
          return { type: 'invited', invite: invite.data }
        }
      }
      return { type: 'invalid-invite' }
    })

    this.#sessionAndInviteState = combineLatest([
      sessionManager.session,
      inviteState,
    ]).pipe(
      map(([session, inviteState]) => {
        if (session) {
          return { type: 'logged-in' }
        }
        return inviteState
      }),
    )
  }

  emailChanged(email: string | null) {
    this.#setEmail(email ?? '')
  }

  async register(inviteCode: string) {
    this.#setState({ type: 'busy' })
    const email = await firstValueFrom(this.#email)
    const sessionKey = createSessionToken()
    const resp = await apiClient.invite[':invite']['register-options'].$get({
      param: { invite: inviteCode },
      query: { providedEmail: email, sessionKey },
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

    const verificationResp = await apiClient.login['invite-verify'].$post({
      json: { sessionKey, ...attResp },
    })
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

    const session = Session.safeParse(verification.session)
    if (!session.success) {
      console.error(session.error)
      this.#setState({ type: 'verification-error' })
      return
    }
    sessionManager.started(session.data, email)

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
