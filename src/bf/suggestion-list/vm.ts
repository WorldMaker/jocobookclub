import { firstValueFrom, Observable } from 'rxjs'
import { SuggestionEditorVm } from '../suggestion-editor/vm.ts'
import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { apiClient } from '../client.ts'
import { Suggestion } from '../../api/models/suggestion.ts'

export class SuggestionVm {
  readonly #suggestionEditor: SuggestionEditorVm

  readonly #suggestion: Suggestion
  get suggestion() {
    return this.#suggestion
  }

  readonly #draft: Observable<boolean>
  get draft() {
    return this.#draft
  }
  readonly #setDraft: (setter: StateSetter<boolean>) => void

  readonly #deleted: Observable<boolean>
  get deleted() {
    return this.#deleted
  }
  readonly #setDeleted: (setter: StateSetter<boolean>) => void

  constructor(suggestionEditor: SuggestionEditorVm, suggestion: Suggestion, draft: boolean) {
    this.#suggestion = suggestion
    this.#suggestionEditor = suggestionEditor
    ;[this.#draft, this.#setDraft] = butterfly(draft)
    ;[this.#deleted, this.#setDeleted] = butterfly(false)
  }

  async edit() {
    const draft = await firstValueFrom(this.draft)
    this.#suggestionEditor.edit(this.#suggestion, draft)
  }

  async delete() {
    const result = await apiClient.suggestion[':id'].$delete({
      param: {
        id: this.#suggestion.id,
      },
    }, {
      headers: {
        'Authorization': `Bearer ${this.#suggestionEditor.session.token}`,
      },
    })
    if (result.ok) {
      this.#setDeleted(true)
    }
  }
}