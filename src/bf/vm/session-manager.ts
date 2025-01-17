import { butterfly } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { Observable } from 'rxjs'

export class SessionManager {
  readonly #session: Observable<Session | null>
  readonly #setSession: (session: Session | null) => void
  get session() {
    return this.#session
  }

  readonly #email: Observable<string | null>
  readonly #setEmail: (email: string | null) => void
  get email() {
    return this.#email
  }

  constructor() {
    ;[this.#session, this.#setSession] = butterfly<Session | null>(null)
    ;[this.#email, this.#setEmail] = butterfly<string | null>(null)

    const maybeSession = localStorage.getItem('session')
    if (maybeSession) {
      const session = Session.safeParse(JSON.parse(maybeSession))
      if (session.success) {
        this.#setSession(session.data)
      }
    }

    const maybeEmail = localStorage.getItem('email')
    if (maybeEmail) {
      this.#setEmail(maybeEmail)
    }
  }

  started(session: Session, email: string) {
    Session.parse(session)
    localStorage.setItem('session', JSON.stringify(session))
    localStorage.setItem('email', email)
    this.#setSession(session)
  }

  ended() {
    this.#setSession(null)
    this.#setEmail(null)
    localStorage.removeItem('session')
    localStorage.removeItem('email')
  }
}
