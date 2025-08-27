import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import rawTags from '../../site/_data/genre/tags.json' with { type: 'json' }
import { Observable } from 'rxjs'

const baseUrl = 'https://worldmaker.net/jocobookclub'

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  name?: string
  tagClass: string
  tagIconClass: string
}

export const genreTags = rawTags as Record<string, TagInfo>

interface GenreTagProps {
  tag: string
  info: TagInfo
}

export function GenreTag({ tag, info }: GenreTagProps) {
  return (
    <a class={`tag ${info.tagClass}`} href={`${baseUrl}/tag/${tag}`}>
      <span class='icon-text'>
        <span class={`icon ${info.tagIconClass}`}>
          <i class={`fa-duotone fa-solid ${info.icon}`}></i>
        </span>
        <span>{info.name ?? info.title}</span>
      </span>
    </a>
  )
}

export function GenreTags({ tags }: { tags: string[] }) {
  return (
    <div class='tags'>
      {tags
        .filter((tag) => Boolean(genreTags[tag]))
        .map((tag) => <GenreTag tag={tag} info={genreTags[tag]} />)}
    </div>
  )
}

export interface GenreTagCheckboxVm {
  genreChecked: (tag: string) => Observable<boolean>
  genreChanged: (tag: string, checked: boolean) => void
}

export interface GenreTagCheckboxProps extends GenreTagProps {
  vm: GenreTagCheckboxVm
}

export interface GenreTagCheckboxEvents {
  change: ObservableEvent<MouseEvent>
}

export function GenreTagCheckbox(
  { tag, info, vm }: GenreTagCheckboxProps,
  { bindImmediateEffect, events }: ComponentContext<GenreTagCheckboxEvents>,
) {
  const { change } = events
  bindImmediateEffect(change, (event) => {
    const checked = (event.target as HTMLInputElement).checked
    vm.genreChanged(tag, checked)
  })
  const checked = vm.genreChecked(tag)
  return (
    <label for={tag} class={`tag ${info.tagClass}`}>
      <span class='icon-text'>
      <input
        id={tag}
        name={tag}
        type='checkbox'
        class='checkbox icon'
        value={tag}
        events={{ change }}
        immediateBind={{ checked }}
      />
        <span class={`icon ${info.tagIconClass}`}>
          <i class={`fa-duotone fa-solid ${info.icon}`}></i>
        </span>
        <span>{info.name ?? info.title}</span>
      </span>
    </label>
  )
}

export interface GenreTagCheckboxesProps {
  vm: GenreTagCheckboxVm
}

export function GenreTagCheckboxes({ vm }: GenreTagCheckboxesProps) {
  return (
    <div class='checkboxes'>
      {Object.entries(genreTags).map(([tag, info]) => (
        <GenreTagCheckbox tag={tag} info={info} vm={vm} />
      ))}
    </div>
  )
}
