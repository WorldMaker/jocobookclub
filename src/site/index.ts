import { LastRankingData } from './history.model.ts'

export function* index(lastRanking: LastRankingData) {
   const sorted = lastRanking.supports
    .map((support, index) => ({
      percentSupport: lastRanking.count > 0 ? support / lastRanking.count : 0,
      ltid: lastRanking.books[index],
    }))
    .sort((a, b) => a.percentSupport - b.percentSupport)

  const firstQuartileMedianIdx = Math.floor(Math.floor(sorted.length / 2) / 2)

  const underdogs = sorted.slice(0, firstQuartileMedianIdx).map(({ ltid }) =>
    ltid
  )

  yield {
    url: `/`,
    layout: 'index.vto',
    underdogs,
  }
}
