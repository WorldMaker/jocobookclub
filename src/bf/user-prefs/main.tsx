import { map, Subscription } from 'rxjs'
import { Login } from '../logout-button/login.tsx'
import { Form } from './form.tsx'
import sessionManager from '../vm/session-manager.ts'
import { UserPrefsManager } from './vm.ts'
import {
  Fragment,
  jsx,
  run,
  runStamps,
  StampCollection,
} from '@worldmaker/butterfloat'

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
  static #formStamp: HTMLTemplateElement | null = null
  #stamps: StampCollection = new StampCollection()

  constructor() {
    super()
    if (!UserPrefsEditorElement.#formStamp) {
      UserPrefsEditorElement.#formStamp = document.querySelector(
        'template#user-prefs-form',
      )
    }
    if (UserPrefsEditorElement.#formStamp) {
      this.#stamps.registerOnlyStamp(Form, UserPrefsEditorElement.#formStamp)
    }
  }

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = runStamps(this, PrefsEditor, this.#stamps)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('user-prefs-editor', UserPrefsEditorElement)

export default UserPrefsEditorElement
