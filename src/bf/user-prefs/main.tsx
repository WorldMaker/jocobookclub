import { map, Subscription } from 'rxjs'
import { Login } from '../logout-button/login.tsx'
import { Form } from './form.tsx'
import sessionManager from '../vm/session-manager.ts'
import { UserPrefsManager } from './vm.ts'
import { Fragment, jsx, run } from '@worldmaker/butterfloat'

function PrefsEditor() {
  const children = sessionManager.session.pipe(
    map((session) =>
      session ? () => <Form vm={new UserPrefsManager(session)} /> : Login
    ),
  )
  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class UserPrefsEditorElement extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, PrefsEditor)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('user-prefs-editor', UserPrefsEditorElement)

export default UserPrefsEditorElement
