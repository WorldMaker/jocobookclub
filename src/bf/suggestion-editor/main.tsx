import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import suggestionEditorVm from './vm.ts'
import { map, type Subscription } from 'rxjs'
import { Form } from './form.tsx'
import { Login } from '../logout-button/login.tsx'

function SuggestionEditor() {
  const children = suggestionEditorVm.pipe(
    map((vm) => vm ? () => <Form vm={vm} /> : Login),
  )
  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class SuggestionEditorElement extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, SuggestionEditor)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('suggestion-editor', SuggestionEditorElement)

export default SuggestionEditorElement
