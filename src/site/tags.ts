import genreTags from './_data/genre/tags.json' with { type: 'json' }
import { LastRankingData } from './history.model.ts'

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  name?: string
  description?: string
}

export function* tags(lastRanking: LastRankingData) {
  for (const [tag, info] of Object.entries(genreTags)) {
    const top5 = lastRanking.ranking
      .toReversed()
      .filter((ltid) => lastRanking.booksByLtId.get(ltid)?.tags.includes(tag))
      .slice(0, 5)
      .map((ltid) => lastRanking.booksByLtId.get(ltid))
      .filter((book) => book !== undefined)

    yield {
      ...info as TagInfo,
      tag,
      tags: ['tag', tag],
      layout: 'tag.vto',
      url: `/tags/${tag}/`,
      lastRankingDate: lastRanking.date,
      lastRankingUrl: lastRanking.url,
      lastRankingByLtId: lastRanking.byLtId,
      top5,
    }
  }
}
