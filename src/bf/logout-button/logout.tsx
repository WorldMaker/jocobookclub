import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

interface LogoutEvents {
  click: ObservableEvent<MouseEvent>
}

export function Logout(
  _: object,
  { bindEffect, events }: ComponentContext<LogoutEvents>,
) {
  const { click } = events
  bindEffect(click, async (_) => {
    const result = await apiClient.user.session.$delete()
    if (result.ok) {
      sessionManager.ended()
    }
  })

  return <button class='button is-warning' events={{ click }}>Logout</button>
}
