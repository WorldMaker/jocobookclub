import { butterfly } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { Observable } from 'rxjs'

export class SessionManager {
  readonly #session: Observable<Session | null>
  readonly #setSession: (session: Session | null) => void
  get session() {
    return this.#session
  }

  constructor() {
    ;[this.#session, this.#setSession] = butterfly<Session | null>(null)

    const maybeSession = localStorage.getItem('session')
    if (maybeSession) {
      const session = Session.safeParse(JSON.parse(maybeSession))
      if (session.success) {
        this.#setSession(session.data)
      }
    }
  }

  started(session: Session) {
    Session.parse(session)
    localStorage.setItem('session', JSON.stringify(session))
    this.#setSession(session)
  }

  ended() {
    this.#setSession(null)
  }
}
