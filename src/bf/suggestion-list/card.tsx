import {
  ComponentContext,
  Fragment,
  jsx,
  ObservableEvent,
} from '@worldmaker/butterfloat'
import { SuggestionVm } from './vm.ts'
import { map, takeUntil } from 'rxjs'
import { filter } from 'rxjs'
import { shareReplay } from 'rxjs'
import { GenreTag, genreTags } from '../genre-tags/index.tsx'

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
      <a href={`https://www.librarything.com/work/${ltid}`} target='_blank'>LibraryThing <i class="fa-duotone fa-solid fa-arrow-up-right-from-square"></i></a>
    </span>
  )
}

function StoryGraphLink({ tsgid }: { tsgid?: string }) {
  if (!tsgid) {
    return <span>No StoryGraph ID yet</span>
  }
  return (
    <span>
      <a href={`https://app.thestorygraph.com/books/${tsgid}`} target='_blank'>StoryGraph <i class="fa-duotone fa-solid fa-arrow-up-right-from-square"></i></a>
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

  bindEffect(
    vm.mySuggestionSaved,
    (suggestion) => vm.suggestionSaved(suggestion),
  )
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
  const tsgLink = vm.suggestion.pipe(
    map((suggestion) => () => <StoryGraphLink tsgid={suggestion.tsgid} />),
  )

  const olidSrc = vm.suggestion.pipe(
    map((suggestion) =>
      suggestion.olid
        ? `https://covers.openlibrary.org/b/olid/${suggestion.olid}-S.jpg`
        : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
    ),
  )
  const olidUrl = vm.suggestion.pipe(
    map((suggestion) =>
      suggestion.olid
        ? `https://openlibrary.org/books/${suggestion.olid}`
        : 'about:blank'
    ),
  )
  const noOlid = vm.suggestion.pipe(map((suggestion) => !suggestion.olid))

  const cannotEdit = vm.canEdit.pipe(map((canEdit) => !canEdit), shareReplay(1))

  const tags = vm.suggestion.pipe(
    map((suggestion) => () => (
      <>
        {(suggestion.tags ?? []).map((tag) => (
          <GenreTag tag={tag} info={genreTags[tag]} />
        ))}
      </>
    )),
  )

  return (
    <div class='card'>
      <div class='card-content'>
        <div class='media'>
          <div class='media-left' classBind={{ 'is-hidden': noOlid }}>
            <a class='image is-64x64' bind={{ href: olidUrl }}>
              <img
                bind={{ src: olidSrc }}
                alt='Cover image'
              />
            </a>
          </div>
          <div class='media-content'>
            <div class='tags'>
              <span
                class='tag'
                classBind={{
                  'is-info': vm.draft,
                  'is-hidden': vm.draft.pipe(map((d) => !d)),
                }}
                bind={{
                  innerText: vm.draft.pipe(
                    map((draft) => draft ? 'Draft' : ''),
                  ),
                }}
              />
              <span
                style='display: contents;'
                childrenBind={tags}
                childrenBindMode='replace'
              />
            </div>
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
        <p class='card-footer-item' childrenBind={tsgLink} childrenBindMode='replace' />
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
