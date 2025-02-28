import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { filter, firstValueFrom, map, Observable, shareReplay, Subject } from 'rxjs'
import { Suggestion } from '../../api/models/suggestion.ts'
import { apiClient } from '../client.ts'
import { SuggestionEditorVm } from '../suggestion-editor/vm.ts'

function isMySuggestion(
  suggestion: Suggestion | null,
  id: string,
): suggestion is Suggestion {
  return suggestion?.id === id
}

export class SuggestionVm {
  readonly #suggestionEditor: SuggestionEditorVm

  readonly #id: string
  readonly #suggestion: Observable<Suggestion>
  get suggestion() {
    return this.#suggestion
  }
  readonly #setSuggestion: (setter: StateSetter<Suggestion>) => void

  readonly #mySuggestionSaved: Observable<Suggestion>
  get mySuggestionSaved() {
    return this.#mySuggestionSaved
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

  readonly #canEdit: Observable<boolean>
  get canEdit() {
    return this.#canEdit
  }

  constructor(
    suggestionEditor: SuggestionEditorVm,
    suggestion: Suggestion,
    draft: boolean,
  ) {
    this.#id = suggestion.id
    this.#suggestionEditor = suggestionEditor
    ;[this.#suggestion, this.#setSuggestion] = butterfly(suggestion)
    ;[this.#draft, this.#setDraft] = butterfly(draft)
    ;[this.#deleted, this.#setDeleted] = butterfly(false)

    this.#mySuggestionSaved = this.#suggestionEditor.suggestionSaved.pipe(
      filter((suggestion) => isMySuggestion(suggestion, this.#id)),
      shareReplay(1),
    )

    this.#canEdit = this.#suggestion.pipe(
      map(
        (suggestion) =>
          this.#suggestionEditor.session.admin ||
          this.#suggestionEditor.session.userId === suggestion.userId,
      ),
      shareReplay(1),
    )
  }

  async edit() {
    const draft = await firstValueFrom(this.draft)
    const suggestion = await firstValueFrom(this.suggestion)
    this.#suggestionEditor.edit(suggestion, draft)
  }

  async delete() {
    const result = await apiClient.suggestion[':id'].$delete(
      {
        param: {
          id: this.#id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.#suggestionEditor.session.token}`,
        },
      },
    )
    if (result.ok) {
      this.#setDeleted(true)
    }
  }

  suggestionSaved(suggestion: Suggestion) {
    this.#setSuggestion(suggestion)
    this.#setDraft(false)
  }
}

export class SuggestionListVm {
  readonly #suggestionEditor: SuggestionEditorVm

  readonly #ids = new Set<string>()

  readonly #suggestions = new Subject<SuggestionVm>()
  get suggestions() {
    return this.#suggestions.asObservable()
  }

  constructor(suggestionEditor: SuggestionEditorVm) {
    this.#suggestionEditor = suggestionEditor

    this.load()
  }

  async load() {
    // drafts
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('suggestion/')) {
        continue
      }
      const suggestion = localStorage.getItem(key)
      if (!suggestion) {
        continue
      }
      const parsed = Suggestion.safeParse(JSON.parse(suggestion))
      if (!parsed.success) {
        continue
      }
      if (this.#ids.has(parsed.data.id)) {
        continue
      }
      const suggestionVm = new SuggestionVm(
        this.#suggestionEditor,
        parsed.data,
        true)
      this.#ids.add(parsed.data.id)
      this.#suggestions.next(suggestionVm)
    }

    // api
    const result = await apiClient.suggestion.$get({}, {
      headers: {
        Authorization: `Bearer ${this.#suggestionEditor.session.token}`,
      },
    })
    if (!result.ok) {
      return
    }
    const { suggestions } = await result.json()
    for (const suggestion of suggestions) {
      if (this.#ids.has(suggestion.id)) {
        continue
      }
      const suggestionVm = new SuggestionVm(
        this.#suggestionEditor,
        suggestion,
        false)
      this.#ids.add(suggestion.id)
      this.#suggestions.next(suggestionVm)
    }
  }

  suggestionSaved(suggestion: Suggestion) {
    if (this.#ids.has(suggestion.id)) {
      return
    }
    const suggestionVm = new SuggestionVm(
      this.#suggestionEditor,
      suggestion,
      false)
    this.#ids.add(suggestion.id)
    this.#suggestions.next(suggestionVm)
  }
}
