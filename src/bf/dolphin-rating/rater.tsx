import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { DolphinsVm } from './vm.ts'
import { combineLatest, map, shareReplay } from 'rxjs'

interface DolphinProps {
  rank: number
  vm: DolphinsVm
}

export interface DolphinEvents {
  hover: ObservableEvent<MouseEvent>
  click: ObservableEvent<MouseEvent>
}

export function Dolphin(
  { rank, vm }: DolphinProps,
  { bindImmediateEffect, events }: ComponentContext<DolphinEvents>,
) {
  bindImmediateEffect(events.hover, (_) => vm.updateHoverRating(rank))
  bindImmediateEffect(events.click, (_) => vm.saveRating(rank))
  return (
    <button
      type='button'
      title='Dolphin'
      class='icon is-large'
      classBind={{
        'has-text-info': vm.bothRatings.pipe(
          map(([rating, current]) =>
            current >= rank && (rating === 0 || rating >= current)
          ),
        ),
        'has-text-link': vm.bothRatings.pipe(
          map(([rating, current]) => rating >= rank && rating !== current),
        ),
      }}
      events={{ mouseover: events.hover, click: events.click }}
    >
      <i
        class='fa-duotone fa-solid fa-dolphin fa-2x'
        classBind={{
          'fa-swap-opacity': vm.currentRating.pipe(
            map((rating) => rating >= rank),
          ),
        }}
      />
    </button>
  )
}

export interface RaterProps {
  vm: DolphinsVm
}

export interface RaterEvents {
  leave: ObservableEvent<MouseEvent>
}

export function Rater(
  { vm }: RaterProps,
  { bindImmediateEffect, events }: ComponentContext<RaterEvents>,
) {
  bindImmediateEffect(events.leave, (_) => vm.updateHoverRating(0))
  return (
    <div events={{ mouseout: events.leave }}>
      {[1, 2, 3, 4, 5].map((rank) => <Dolphin rank={rank} vm={vm} />)}
    </div>
  )
}
