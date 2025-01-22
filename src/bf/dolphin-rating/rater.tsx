import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { DolphinsVm } from './vm.ts'
import { combineLatest, map, shareReplay } from 'rxjs'

interface DolphinProps {
  rank: number
  vm: DolphinsVm
}

interface DolphinEvents {
  hover: ObservableEvent<MouseEvent>
  click: ObservableEvent<MouseEvent>
}

function Dolphin({ rank, vm }: DolphinProps, { bindImmediateEffect, events }: ComponentContext<DolphinEvents>) {
  bindImmediateEffect(events.hover, (_) => vm.updateHoverRating(rank))
  bindImmediateEffect(events.click, (_) => vm.saveRating(rank))
  const bothRatings = combineLatest([vm.hoverRating, vm.currentRating]).pipe(shareReplay(1))
  return <span class='icon is-large is-clickable' classBind={{
    'has-text-info': bothRatings.pipe(map(([rating, current]) => current >= rank && (rating === 0 || rating >= current))),
    'has-text-link': bothRatings.pipe(map(([rating, current]) => rating >= rank && rating !== current)),
    }}
    events={{ mouseover: events.hover, click: events.click }}>
    <i class='fa-duotone fa-solid fa-dolphin fa-2x' classBind={{'fa-swap-opacity': vm.currentRating.pipe(map(rating => rating >= rank))}} />
  </span>
}

export interface RaterProps {
  vm: DolphinsVm
}

export interface RaterEvents {
  leave: ObservableEvent<MouseEvent>
}

export function Rater({ vm }: RaterProps, { bindImmediateEffect, events }: ComponentContext<RaterEvents>) {
  bindImmediateEffect(events.leave, (_) => vm.updateHoverRating(0))
  return (
    <div events={{ mouseout: events.leave }}>
      <Dolphin rank={1} vm={vm} />
      <Dolphin rank={2} vm={vm} />
      <Dolphin rank={3} vm={vm} />
      <Dolphin rank={4} vm={vm} />
      <Dolphin rank={5} vm={vm} />
    </div>
  )
}
