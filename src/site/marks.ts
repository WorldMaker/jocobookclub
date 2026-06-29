import { Mark } from '@worldmaker/jocobookclub-api/models'
import rawMarks from './_data/genre/marks.json' with { type: 'json' }
import { LastRankingData } from './history.model.ts'

export function* marks(lastRanking: LastRankingData) {
  const twoMonthsAgo = Temporal.Now.zonedDateTimeISO().subtract({ months: 2 })

  for (const [mark, info] of Object.entries(rawMarks)) {
    const recentMarksByUser: Record<string, [string, Date]> = {}
    const allMarks: Record<string, [string, Date][]> = {}

    for (let i = 0; i < lastRanking.books.length; i++) {
      const ltid = lastRanking.books[i]
      if (!(ltid in allMarks)) {
        allMarks[ltid] = []
      }
      const bookMarks = lastRanking.marks[i]?.[mark as Mark]
      if (bookMarks) {
        for (const [userId, date] of Object.entries(bookMarks)) {
          const instant = date!.toTemporalInstant()
          if (Temporal.Instant.compare(instant, twoMonthsAgo) > 0) {
            if (
              userId in recentMarksByUser &&
              Temporal.Instant.compare(
                  instant,
                  recentMarksByUser[userId][1].toTemporalInstant(),
                ) > 0
            ) {
              recentMarksByUser[userId] = [ltid, date!]
            } else if (!(userId in recentMarksByUser)) {
              recentMarksByUser[userId] = [ltid, date!]
            }
          }
          allMarks[ltid].push([userId, date!])
        }
      }
    }

    const recentMarks = Object.entries(recentMarksByUser).reduce(
      (acc, [userId, [ltid, date]]) => ({
        ...acc,
        [ltid]: [...(acc[ltid] ?? []), [userId, date] satisfies [string, Date]],
      }),
      {} as Record<string, [string, Date][]>,
    )

    yield {
      url: `/marks/${mark}/`,
      layout: 'mark.vto',
      ...info,
      title: info.name,
      lastRankingDate: lastRanking.date,
      lastRankingUrl: lastRanking.url,
      lastRankingByLtId: lastRanking.byLtId,
      mark,
      books: lastRanking.books,
      recentMarks,
      allMarks,
    }
  }
}
