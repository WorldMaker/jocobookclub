import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import leaderBoardVm from './vm.ts'
import { map, of, Subscription, switchMap } from 'rxjs'
import { Login } from './login.tsx'
import { Table } from './table.tsx'

function LeaderBoard() {
  const children = leaderBoardVm.pipe(
    switchMap((vm) =>
      vm
        ? vm.leaderboard.pipe(
          map((lb) =>
            lb
              ? () => <Table leaderboard={lb} />
              : () => (
                <progress class='progress is-small is-primary' max={100} />
              )
          ),
        )
        : of(Login)
    ),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class LeaderBoardComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, LeaderBoard)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('leader-board', LeaderBoardComponent)
export default LeaderBoardComponent
