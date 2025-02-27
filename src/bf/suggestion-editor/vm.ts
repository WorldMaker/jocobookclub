import { ulid } from '@std/ulid'
import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { Session, Suggestion } from '@worldmaker/jocobookclub-api/models'
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs'
import { SafeParseReturnType } from 'zod'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

export class SuggestionEditorVm {
  readonly #session: Session
  get session() {
    return this.#session
  }
  readonly #suggestion: Observable<Suggestion | null>
  get suggestion() {
    return this.#suggestion
  }
  readonly #setSuggestion: (setter: StateSetter<Suggestion | null>) => void
  #savedSuggestion: Suggestion | null = null
  readonly #unsaved: Observable<boolean>
  get unsaved() {
    return this.#unsaved
  }
  readonly #valid: Observable<SafeParseReturnType<unknown, Suggestion>>
  get valid() {
    return this.#valid
  }

  constructor(session: Session) {
    this.#session = session
    ;[this.#suggestion, this.#setSuggestion] = butterfly<Suggestion | null>(
      null,
    )

    this.#unsaved = this.suggestion.pipe(
      map((suggestion) => {
        if (!suggestion) {
          return false
        }
        if (!this.#savedSuggestion) {
          return true
        }
        if (suggestion.title !== this.#savedSuggestion.title) {
          return true
        }
        if (suggestion.author !== this.#savedSuggestion.author) {
          return true
        }
        if (suggestion.ltid !== this.#savedSuggestion.ltid) {
          return true
        }
        if (suggestion.whyBlurb !== this.#savedSuggestion.whyBlurb) {
          return true
        }
        if (suggestion.cw !== this.#savedSuggestion.cw) {
          return true
        }
        return false
      }),
      shareReplay(1),
    )

    this.#valid = this.suggestion.pipe(
      map((suggestion) => Suggestion.safeParse(suggestion)),
      shareReplay(1),
    )

    this.load()
  }

  #updateSuggestion(suggestion: StateSetter<Suggestion>) {
    this.#setSuggestion((existing) => {
      const newSuggestion = typeof suggestion === 'function'
        ? (existing ? suggestion(existing) : null)
        : suggestion
      if (!newSuggestion) {
        return null
      }
      localStorage.setItem('suggestion-id', newSuggestion.id)
      localStorage.setItem(
        `suggestion/${newSuggestion.id}`,
        JSON.stringify(newSuggestion),
      )
      return newSuggestion
    })
  }

  new() {
    const id = ulid()
    localStorage.setItem('suggestion-id', id)
    this.#savedSuggestion = null
    this.#updateSuggestion({
      id: id,
      userId: this.#session.userId,
      title: '',
      author: '',
      whyBlurb: '',
      updated: new Date().toISOString(),
    })
  }

  async load() {
    const currentSuggestionId = localStorage.getItem('suggestion-id')
    if (!currentSuggestionId) {
      this.new()
      return
    }
    const existingSuggestion = localStorage.getItem(
      `suggestion/${currentSuggestionId}`,
    )
    if (!existingSuggestion) {
      this.new()
      return
    }
    this.#updateSuggestion(JSON.parse(existingSuggestion))
    const localSavedSuggestion = localStorage.getItem(
      `saved/suggestion/${currentSuggestionId}`,
    )
    if (localSavedSuggestion) {
      this.#savedSuggestion = JSON.parse(localSavedSuggestion)
    }
    const remoteResult = await apiClient.suggestion[':id'].$get({
      param: { id: currentSuggestionId },
    }, { headers: { Authorization: `Bearer ${this.#session.token}` } })
    if (!remoteResult.ok) {
      return
    }
    const remoteSuggestion = await remoteResult.json()
    this.#updateSuggestion((local) => {
      const newSuggestion = structuredClone(remoteSuggestion)

      // "three-way merge"-ish apply local changes to remote suggestion
      if (local && this.#savedSuggestion) {
        if (local.title !== this.#savedSuggestion.title) {
          newSuggestion.title = local.title
        }
        if (local.author !== this.#savedSuggestion.author) {
          newSuggestion.author = local.author
        }
        if (local.whyBlurb !== this.#savedSuggestion.whyBlurb) {
          newSuggestion.whyBlurb = local.whyBlurb
        }
        if (local.cw !== this.#savedSuggestion.cw) {
          newSuggestion.cw = local.cw
        }
      }

      this.#savedSuggestion = structuredClone(remoteSuggestion)
      localStorage.setItem(
        `saved/suggestion/${currentSuggestionId}`,
        JSON.stringify(remoteSuggestion),
      )
      return newSuggestion
    })
  }

  edit(suggestion: Suggestion, draft = false) {
    localStorage.setItem('suggestion-id', suggestion.id)
    if (draft) {
      this.#savedSuggestion = null
    } else {
      this.#savedSuggestion = structuredClone(suggestion)
      localStorage.setItem(
        `saved/suggestion/${suggestion.id}`,
        JSON.stringify(suggestion),
      )
    }
    this.#updateSuggestion(suggestion)
  }

  async save() {
    const suggestion = await firstValueFrom(this.suggestion)
    if (!suggestion) {
      return
    }
    const valid = Suggestion.safeParse(suggestion)
    if (!valid.success) {
      return
    }
    const result = await apiClient.suggestion[':id'].$put({
      param: { id: suggestion.id },
      json: suggestion,
    }, { headers: { Authorization: `Bearer ${this.#session.token}` } })
    if (result.ok) {
      localStorage.removeItem(`suggestion/${suggestion.id}`)
      localStorage.removeItem(`saved/suggestion/${suggestion.id}`)
      this.new()
    }
  }

  titleChanged(title: string) {
    this.#updateSuggestion((s) => ({ ...s, title }))
  }

  authorChanged(author: string) {
    this.#updateSuggestion((s) => ({ ...s, author }))
  }

  ltidChanged(ltid: string) {
    this.#updateSuggestion((s) => ({ ...s, ltid }))
  }

  whyBlurbChanged(whyBlurb: string) {
    this.#updateSuggestion((s) => ({ ...s, whyBlurb }))
  }

  cwChanged(cw: string | undefined) {
    this.#updateSuggestion((s) => ({ ...s, cw }))
  }
}

const suggestionEditorVm = sessionManager.session.pipe(
  map((session) => session ? new SuggestionEditorVm(session) : null),
  shareReplay(1),
)

export default suggestionEditorVm
