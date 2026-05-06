import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import rawMarks from '../../site/_data/genre/marks.json' with { type: 'json' }
import { combineLatest, map, Observable, shareReplay } from 'rxjs'
import { Mark, TallyBookMarks } from '@worldmaker/jocobookclub-api/models'

const baseUrl = 'https://worldmaker.net/jocobookclub'

interface MarkInfo {
  iconClass: string
  icon: string
  name: string
  tagClass: string
  tagIconClass: string
}

export const genreMarks = rawMarks as Record<Mark, MarkInfo>

interface GenreMarkProps {
  mark: Mark
  count: number
  info: MarkInfo
  condense?: boolean
}

export function GenreMark({ mark, count, info, condense }: GenreMarkProps) {
  return (
    <a
      class={`tags has-addons`}
      title={`${info.name} (${count})`}
      href={`${baseUrl}/marks/${mark}`}
    >
      <span class={`tag ${info.tagClass}`}>
        <span class='icon-text'>
          <span class={`icon ${info.tagIconClass}`}>
            <i class={`fa-duotone fa-solid ${info.icon}`}></i>
          </span>
        </span>
      </span>
      <span class={`tag ${condense ? 'is-hidden-mobile' : ''}`}>
        {count}
      </span>
    </a>
  )
}

export function GenreMarks(
  { marks, condense }: { marks: TallyBookMarks; condense?: boolean },
) {
  return (
    <div class='tags'>
      {Object.entries(marks)
        .filter(([mark]) => Boolean(genreMarks[mark as Mark]))
        .map(([mark, userMarks]) => (
          <GenreMark
            mark={mark as Mark}
            count={Object.keys(userMarks).length}
            info={genreMarks[mark as Mark]}
            condense={condense}
          />
        ))}
    </div>
  )
}

export interface GenreMarkSelectorVm {
  currentMark: Observable<Mark | null>
  markIsSelected: (mark: Mark) => Observable<boolean>
  markIsHovered: (mark: Mark) => Observable<boolean>
  markHovered: (mark: Mark | null) => void
  markSelected: (mark: Mark | null) => void
}

export interface GenreMarkSelectorProps {
  mark: Mark
  info: MarkInfo
  vm: GenreMarkSelectorVm
}

export interface GenreMarkSelectorEvents {
  hover: ObservableEvent<MouseEvent>
  click: ObservableEvent<PointerEvent>
}

export function GenreMarkSelector(
  { mark, info, vm }: GenreMarkSelectorProps,
  { events, bindImmediateEffect }: ComponentContext<GenreMarkSelectorEvents>,
) {
  bindImmediateEffect(events.click, (_) => vm.markSelected(mark))
  bindImmediateEffect(events.hover, (_) => vm.markHovered(mark))
  const isHovered = vm.markIsHovered(mark)
  const isSelected = vm.markIsSelected(mark)
  const isHoveredOrSelected = combineLatest([isHovered, isSelected]).pipe(
    map(([hovered, selected]) => hovered || selected),
  )
  return (
    <button
      type='button'
      class='icon is-large'
      title={info.name}
      classBind={{
        [info.iconClass]: isHoveredOrSelected,
      }}
      events={{ mouseover: events.hover, click: events.click }}
    >
      <i
        class={`fa-duotone fa-solid ${info.icon} fa-2x`}
        classBind={{ 'fa-swap-opacity': isHovered }}
      />
    </button>
  )
}

export interface GenreMarkSelectorListEvents {
  leave: ObservableEvent<MouseEvent>
  emptyMark: ObservableEvent<PointerEvent>
  emptyMarkHover: ObservableEvent<MouseEvent>
}

export function GenreMarkSelectorList(
  { vm }: { vm: GenreMarkSelectorVm },
  { events, bindImmediateEffect }: ComponentContext<
    GenreMarkSelectorListEvents
  >,
) {
  bindImmediateEffect(events.leave, (_) => vm.markHovered(null))
  bindImmediateEffect(events.emptyMark, (_) => vm.markSelected(null))
  bindImmediateEffect(events.emptyMarkHover, (_) => vm.markHovered(null))
  return (
    <div events={{ mouseleave: events.leave }}>
      {Object.entries(genreMarks).map(([mark, info]) => (
        <GenreMarkSelector mark={mark as Mark} info={info} vm={vm} />
      ))}
      <button
        type='button'
        class='icon is-large'
        title='No mark'
        events={{ click: events.emptyMark, mouseover: events.emptyMarkHover }}
      >
        <i class='fa-duotone fa-solid fa-circle-small fa-2x' />
      </button>
    </div>
  )
}

export interface GenreMarkSelectorPopoverEvents {
  popoverAttach: ObservableEvent<HTMLElement>
}

export function GenreMarkSelectorPopover(
  { vm, ltid }: { vm: GenreMarkSelectorVm; ltid: string },
  { events }: ComponentContext<GenreMarkSelectorPopoverEvents>,
) {
  const currentMarkInfo = vm.currentMark.pipe(
    map((mark) =>
      mark ? genreMarks[mark] : {
        iconClass: '',
        icon: 'fa-circle-small',
        name: 'No mark',
        tagClass: '',
        tagIconClass: '',
      }
    ),
    shareReplay(1),
  )
  return (
    <div>
      <button
        type='button'
        class='icon is-large'
        title='Mark selector'
        popoverTargetAction='toggle'
        style={`anchor-name: --mark-${ltid}`}
        bind={{
          popoverTargetElement: events.popoverAttach,
          title: currentMarkInfo.pipe(map((info) => info.name)),
          className: currentMarkInfo.pipe(
            map((info) => `icon is-large ${info.iconClass}`),
          ),
        }}
      >
        <i
          class='fa-duotone fa-solid fa-2x'
          bind={{
            className: currentMarkInfo.pipe(
              map((info) => `fa-duotone fa-solid fa-2x ${info.icon}`),
            ),
          }}
        />
      </button>
      <div
        popover='auto'
        style={`position-anchor: --mark-${ltid}; position-area: bottom;`}
        events={{ bfDomAttach: events.popoverAttach }}
      >
        <GenreMarkSelectorList vm={vm} />
      </div>
    </div>
  )
}
