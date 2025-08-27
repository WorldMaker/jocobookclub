import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { SuggestionEditorVm } from './vm.ts'
import { combineLatest, map, shareReplay } from 'rxjs'
import { GenreTagCheckboxes } from '../genre-tags/index.tsx'

export interface SuggestionEditorFormProps {
  vm: SuggestionEditorVm
}

export interface SuggestionEditorFormEvents {
  new: ObservableEvent<MouseEvent>
  save: ObservableEvent<SubmitEvent>
  titleChanged: ObservableEvent<InputEvent>
  authorChanged: ObservableEvent<InputEvent>
  ltidChanged: ObservableEvent<InputEvent>
  whyBlurbChanged: ObservableEvent<InputEvent>
  cwChanged: ObservableEvent<InputEvent>
}

export function Form(
  { vm }: SuggestionEditorFormProps,
  { bindEffect, bindImmediateEffect, events }: ComponentContext<
    SuggestionEditorFormEvents
  >,
) {
  bindEffect(events.new, () => vm.new())
  bindImmediateEffect(events.save, (e) => {
    e.preventDefault()
    vm.save()
  })

  bindImmediateEffect(
    events.titleChanged,
    (e) => vm.titleChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(
    events.authorChanged,
    (e) => vm.authorChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(
    events.ltidChanged,
    (e) => vm.ltidChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(
    events.whyBlurbChanged,
    (e) => vm.whyBlurbChanged((e.target as HTMLInputElement).value),
  )
  bindImmediateEffect(
    events.cwChanged,
    (e) => vm.cwChanged((e.target as HTMLInputElement).value),
  )

  const title = vm.suggestion.pipe(map((suggestion) => suggestion?.title ?? ''))
  const titleInvalid = vm.valid.pipe(
    map((valid) =>
      !valid.success &&
      valid.error.issues.some((issue) => issue.path[0] === 'title')
    ),
    shareReplay(1),
  )
  const titleError = vm.valid.pipe(
    map((valid) =>
      valid.success
        ? ''
        : valid.error.issues.find((issue) => issue.path[0] === 'title')
          ?.message ?? ''
    ),
  )
  const author = vm.suggestion.pipe(
    map((suggestion) => suggestion?.author ?? ''),
  )
  const authorInvalid = vm.valid.pipe(
    map((valid) =>
      !valid.success &&
      valid.error.issues.some((issue) => issue.path[0] === 'author')
    ),
    shareReplay(1),
  )
  const authorError = vm.valid.pipe(
    map((valid) =>
      valid.success
        ? ''
        : valid.error.issues.find((issue) => issue.path[0] === 'author')
          ?.message ?? ''
    ),
  )
  const ltid = vm.suggestion.pipe(map((suggestion) => suggestion?.ltid ?? ''))
  const ltidInvalid = vm.valid.pipe(
    map((valid) =>
      !valid.success &&
      valid.error.issues.some((issue) => issue.path[0] === 'ltid')
    ),
    shareReplay(1),
  )
  const ltidError = vm.valid.pipe(
    map((valid) =>
      valid.success
        ? ''
        : valid.error.issues.find((issue) => issue.path[0] === 'ltid')
          ?.message ?? ''
    ),
  )
  const whyBlurb = vm.suggestion.pipe(
    map((suggestion) => suggestion?.whyBlurb ?? ''),
  )
  const whyBlurbInvalid = vm.valid.pipe(
    map((valid) =>
      !valid.success &&
      valid.error.issues.some((issue) => issue.path[0] === 'whyBlurb')
    ),
    shareReplay(1),
  )
  const whyBlurbError = vm.valid.pipe(
    map((valid) =>
      valid.success
        ? ''
        : valid.error.issues.find((issue) => issue.path[0] === 'whyBlurb')
          ?.message ?? ''
    ),
  )
  const cw = vm.suggestion.pipe(map((suggestion) => suggestion?.cw ?? ''))
  const cwInvalid = vm.valid.pipe(
    map((valid) =>
      !valid.success &&
      valid.error.issues.some((issue) => issue.path[0] === 'cw')
    ),
    shareReplay(1),
  )
  const cwError = vm.valid.pipe(
    map((valid) =>
      valid.success
        ? ''
        : valid.error.issues.find((issue) => issue.path[0] === 'cw')?.message ??
          ''
    ),
  )

  const suggestionInvalid = vm.valid.pipe(
    map((valid) => !valid.success),
    shareReplay(1),
  )
  const suggestionSavedOrInvalid = combineLatest([vm.unsaved, vm.valid]).pipe(
    map(([unsaved, valid]) => !unsaved || !valid.success),
    shareReplay(1),
  )

  return (
    <form class='suggestion-editor-form' events={{ submit: events.save }}>
      <div class='field'>
        <label htmlFor='title' class='label'>Title</label>
        <div class='control'>
          <input
            id='title'
            class='input'
            type='text'
            placeholder='Title'
            immediateBind={{ value: title }}
            events={{ change: events.titleChanged }}
            classBind={{ 'is-danger': titleInvalid }}
          />
        </div>
        <p
          class='help'
          classBind={{ 'is-danger': titleInvalid }}
          bind={{ innerText: titleError }}
        />
      </div>
      <div class='field'>
        <label htmlFor='author' class='label'>Author</label>
        <div class='control'>
          <input
            id='author'
            class='input'
            type='text'
            placeholder='Author'
            immediateBind={{ value: author }}
            events={{ change: events.authorChanged }}
            classBind={{ 'is-danger': authorInvalid }}
          />
        </div>
        <p
          class='help'
          classBind={{ 'is-danger': authorInvalid }}
          bind={{ innerText: authorError }}
        />
      </div>
      <div class='field'>
        <label htmlFor='ltid' class='label'>LibraryThing Work ID</label>
        <div class='field has-addons'>
          <div class='control'>
            <a class='button is-static'>
              https://www.librarything.com/work/
            </a>
          </div>
          <div class='control is-expanded'>
            <input
              id='ltid'
              class='input'
              type='text'
              placeholder='LibraryThing Work ID'
              immediateBind={{ value: ltid }}
              events={{ change: events.ltidChanged }}
              classBind={{ 'is-danger': ltidInvalid }}
            />
          </div>
        </div>
        <p
          class='help'
          classBind={{ 'is-danger': ltidInvalid }}
          bind={{ innerText: ltidError }}
        />
        <p class='help'>
          Optionally provide the LibraryThing Work ID to help make sure we find
          the right book
        </p>
      </div>
      <div class='field'>
        <label htmlFor='whyBlurb' class='label'>Why should we read this?</label>
        <div class='control'>
          <textarea
            id='whyBlurb'
            class='textarea'
            placeholder='Why should we read this?'
            immediateBind={{ value: whyBlurb }}
            events={{ change: events.whyBlurbChanged }}
            classBind={{ 'is-danger': whyBlurbInvalid }}
          />
        </div>
        <p
          class='help'
          classBind={{ 'is-danger': whyBlurbInvalid }}
          bind={{ innerText: whyBlurbError }}
        />
      </div>
      <div class='field'>
        <label htmlFor='cw' class='label'>Content Warnings</label>
        <div class='control'>
          <textarea
            id='cw'
            class='textarea'
            placeholder='Content Warnings'
            immediateBind={{ value: cw }}
            events={{ change: events.cwChanged }}
            classBind={{ 'is-danger': cwInvalid }}
          />
        </div>
        <p
          class='help'
          classBind={{ 'is-danger': cwInvalid }}
          bind={{ innerText: cwError }}
        />
        <p class='help'>
          Optionally provide content warnings/content notes for the book that
          you think the club should especially pay attention to
        </p>
      </div>
      <div class='field'>
        <GenreTagCheckboxes vm={vm} />
        <p class='help'>
          Optionally select all relevant genres for this suggestion. "Boat"
          means the author has attended at least one JoCo Cruise. For the
          rest, use your best judgment, because the definitions are subjective
        </p>
      </div>
      <div class='field is-grouped'>
        <div class='control'>
          <button
            type='button'
            class='button is-warning'
            events={{ click: events.new }}
          >
            New
          </button>
        </div>
        <div class='control is-expanded'>
          <button
            type='submit'
            class='button is-fullwidth'
            classBind={{
              'is-danger': suggestionInvalid,
              'is-primary': suggestionSavedOrInvalid.pipe(
                map((notReady) => !notReady),
              ),
            }}
            bind={{ disabled: suggestionSavedOrInvalid }}
          >
            Save
          </button>
        </div>
      </div>
    </form>
  )
}
