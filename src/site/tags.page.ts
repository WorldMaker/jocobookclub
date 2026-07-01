import genreTags from './_data/genre/tags.json' with { type: 'json' }
import site from './_config.ts'
import { getHistory } from './history.data.ts'

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  name?: string
  description?: string
}

export default async function* tags() {
  const { booksByLtId, lastRanking } = await getHistory(site)
  for (const [tag, info] of Object.entries(genreTags)) {
    const top5 = lastRanking.tally.ranking
      .toReversed()
      .filter((ltid) => booksByLtId.get(ltid)?.tags.includes(tag))
      .slice(0, 5)
      .map((ltid) => booksByLtId.get(ltid))
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
