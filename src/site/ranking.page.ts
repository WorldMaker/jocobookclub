import site from './_config.ts'
import { getRecentWindowDescription } from './bf/chunk-JUXZOUOV.js'
import { getHistory } from './history.data.ts'

export default async function* ranking() {
  const { booksByLtId: books, rankings } = await getHistory(site)

  for (const ranking of rankings) {
    yield {
      ...ranking.tally,
      layout: 'ranking.vto',
      title: `Ranking — ${ranking.date.toLocaleString()}`,
      url: ranking.path,
      booksByLtId: books,
      rankingDate: ranking.date,
      lastRankingUrl: ranking.lastEntry?.url,
      lastRankingByLtId: ranking.lastEntry?.byLtId,
      recentWindowDescription: getRecentWindowDescription(ranking.tally.recentWindow),
      tags: ['history'],
    }
  }
}
