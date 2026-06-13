import { jsx } from '@worldmaker/butterfloat'
import { Leaderboard } from '@worldmaker/jocobookclub-api/models'

interface TableProps {
  leaderboard: Leaderboard
}

export function Table({ leaderboard }: TableProps) {
  return (
    <table class='table'>
      <thead>
        <tr>
          <th>Rank</th>
          <th>
            <i class='fa-duotone fa-solid fa-user-astronaut'></i> JoCoNaut
          </th>
          <th>Supports</th>
          <th>Total Ranked</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.leaders.map((leader, index) => (
          <tr>
            <td>{index + 1}</td>
            <td>{leader.name}</td>
            <td>
              <progress
                class='progress is-info'
                value={leader.supportPercent * 100}
                max={100}
                title={`Supports ${
                  leader.supportPercent.toLocaleString(undefined, {
                    style: 'percent',
                    minimumFractionDigits: 0,
                  })
                } of the current ballot`}
              >
                {leader.supportPercent.toLocaleString(undefined, {
                  style: 'percent',
                  minimumFractionDigits: 0,
                })}
              </progress>
            </td>
            <td>{leader.totalBooksRanked}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
