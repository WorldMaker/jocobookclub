import { jsx } from '@worldmaker/butterfloat'
import { SuggestionListVm } from './vm.ts'
import { map } from 'rxjs'
import { SuggestionCard } from './card.tsx'

export interface SuggestionListProps {
  vm: SuggestionListVm
}

export function SuggestionList(
  { vm }: SuggestionListProps,
) {
  const children = vm.suggestions.pipe(
    map((suggestion) => () => <SuggestionCard vm={suggestion} />),
  )

  return (
    <div
      class='grid is-column-min-18'
      childrenBind={children}
      childrenBindMode='append'
    />
  )
}
