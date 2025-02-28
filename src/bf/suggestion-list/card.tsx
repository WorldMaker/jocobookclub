import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { SuggestionVm } from './vm.ts'
import { map, takeUntil } from 'rxjs'
import { filter } from 'rxjs'
import { shareReplay } from 'rxjs'

export interface SuggestionCardProps {
  vm: SuggestionVm
}

export interface SuggestionCardEvents {
  edit: ObservableEvent<MouseEvent>
  delete: ObservableEvent<MouseEvent>
}

function LibraryThingLink({ ltid }: { ltid?: string }) {
  if (!ltid) {
    return <span>No LibraryThing ID yet</span>
  }
  return (
    <span>
      View on{' '}
      <a href={`https://www.librarything.com/work/${ltid}`}>LibraryThing</a>
    </span>
  )
}

export function SuggestionCard(
  props: SuggestionCardProps,
  { bindEffect, bindImmediateEffect, events }: ComponentContext<
    SuggestionCardEvents
  >,
) {
  const { vm } = props

  bindEffect(vm.mySuggestionSaved, vm.suggestionSaved)
  bindImmediateEffect(events.edit, () => vm.edit())
  // complete on delete to remove the card
  bindImmediateEffect(
    events.delete.pipe(
      takeUntil(vm.deleted.pipe(filter((deleted) => deleted))),
    ),
    () => vm.delete(),
  )

  const title = vm.suggestion.pipe(map((suggestion) => suggestion.title))
  const author = vm.suggestion.pipe(map((suggestion) => suggestion.author))

  const ltLink = vm.suggestion.pipe(
    map((suggestion) => () => <LibraryThingLink ltid={suggestion.ltid} />),
  )

  const cannotEdit = vm.canEdit.pipe(map((canEdit) => !canEdit), shareReplay(1))

  return (
    <div class='card'>
      <div class='card-content'>
        <div class='media'>
          <div class='media-content'>
            <span
              class='tag'
              classBind={{ 'is-info': vm.draft }}
              bind={{
                innerText: vm.draft.pipe(map((draft) => draft ? 'Draft' : '')),
              }}
            />
            <p class='title is-4' bind={{ innerText: title }} />
            <p class='subtitle is-6' bind={{ innerText: author }} />
          </div>
        </div>
        <div class='content'>
          <strong>Why should we read this book?</strong>
          <p
            bind={{
              innerText: vm.suggestion.pipe(
                map((suggestion) => suggestion.whyBlurb),
              ),
            }}
          />

          <strong>Content Warnings/Content Notes:</strong>
          <p
            bind={{
              innerText: vm.suggestion.pipe(
                map((suggestion) => suggestion.cw ?? ''),
              ),
            }}
          />
        </div>
      </div>
      <footer class='card-footer'>
        <p
          class='card-footer-item'
          childrenBind={ltLink}
          childrenBindMode='replace'
        />
        <p class='card-footer-item buttons'>
          <button
            type='button'
            class='button is-small is-primary'
            bind={{ disabled: cannotEdit }}
            events={{ click: events.edit }}
          >
            Edit
          </button>
          <button
            type='button'
            class='button is-small is-danger'
            bind={{ disabled: cannotEdit }}
            events={{ click: events.delete }}
          >
            Delete
          </button>
        </p>
      </footer>
    </div>
  )
}
