import site from './_config.ts'
import { getHistory } from './history.data.ts'

export default async function* index() {
  const { booksByLtId, lastRanking } = await getHistory(site)
  const sorted = (lastRanking.tally.supports ?? [])
    .map((support, index) => ({
      percentSupport: lastRanking.tally.count > 0
        ? support / lastRanking.tally.count
        : 0,
      ltid: lastRanking.tally.books[index],
    }))
    .sort((a, b) => a.percentSupport - b.percentSupport)

  const firstQuartileMedianIdx = Math.floor(Math.floor(sorted.length / 2) / 2)

  const underdogs = sorted.slice(0, firstQuartileMedianIdx).map(({ ltid }) =>
    ltid
  )

  const top5 = lastRanking.tally.ranking
    .toReversed()
    .slice(0, 5)
    .map((ltid) => booksByLtId.get(ltid))

  yield {
    url: `/`,
    layout: 'index.vto',
    underdogs,
    lastRankingDate: lastRanking.date,
    lastRankingUrl: lastRanking.url,
    top5,
  }
}
