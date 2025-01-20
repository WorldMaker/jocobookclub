import { ComponentContext, jsx, ObservableEvent } from '@worldmaker/butterfloat'
import { Session } from '@worldmaker/jocobookclub-api/models'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

export interface LogoutProps {
  session: Session
}

interface LogoutEvents {
  click: ObservableEvent<MouseEvent>
}

export function Logout(
  { session }: LogoutProps,
  { bindEffect, events }: ComponentContext<LogoutEvents>,
) {
  const { click } = events
  bindEffect(click, async (_) => {
    const result = await apiClient.user.session.$delete({}, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    if (result.ok) {
      sessionManager.ended()
    }
  })

  return <button class='button is-warning' events={{ click }}>Logout</button>
}
