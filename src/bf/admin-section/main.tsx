import {
  ComponentContext,
  Fragment,
  jsx,
  ObservableEvent,
  run,
} from '@worldmaker/butterfloat'
import { AdminVm } from './vm.ts'
import sessionManager from '../vm/session-manager.ts'
import { map, Subscription } from 'rxjs'

interface AdminProps {
  vm: AdminVm
}

interface AdminEvents {
  recount: ObservableEvent<MouseEvent>
}

function AdminSection(
  { vm }: AdminProps,
  { bindEffect, events }: ComponentContext<AdminEvents>,
) {
  bindEffect(events.recount, () => vm.recount())
  return (
    <section class='section'>
      <h1 class='title'>
        <span class='icon has-text-warning'>
          <i class='fa-duotone fa-solid fa-user-visor' />
        </span>{' '}
        Administration
      </h1>
      <p class='block'>
        When changes are made to the ballot (a new book is added, an existing
        book was moved to "Held", things like that) the ballots will all
        eventually get recounted as people vote on the new ballot. However, if
        you need to force a recount here's the button to do it:
      </p>
      <button class='button is-warning'>Recount All Ballots!</button>
    </section>
  )
}

function AdminSectionLoader() {
  const children = sessionManager.session.pipe(
    map((session) => {
      if (session && session.admin) {
        return () => <AdminSection vm={new AdminVm(session)} />
      }
      return () => <></>
    }),
  )
  return (
    <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
  )
}

class AdminSectionElement extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, AdminSectionLoader)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}
customElements.define('admin-section', AdminSectionElement)

export default AdminSectionElement
