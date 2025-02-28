import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import { map, Subscription } from 'rxjs'
import { Login } from '../logout-button/login.tsx'
import suggestionEditorVm from '../suggestion-editor/vm.ts'
import { SuggestionList } from './list.tsx'
import { SuggestionListVm } from './vm.ts'

function List() {
  const children = suggestionEditorVm.pipe(
    map((vm) =>
      vm ? () => <SuggestionList vm={new SuggestionListVm(vm)} /> : Login
    ),
  )
  return <Fragment childrenBind={children} childrenBindMode='replace' />
}

class SuggestionListElement extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, List)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('suggestion-list', SuggestionListElement)
export default SuggestionListElement
