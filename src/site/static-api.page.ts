import genreTags from './_data/genre/tags.json' with { type: 'json' }
import site from './_config.ts'

interface BookInfo {
  title: string
  author: string
  scheduledDate?: Date
  ltid: string
  url: string
}

interface BooksByLtid {
  [key: string]: BookInfo
}

function byLtId(books: BookInfo[]): BooksByLtid {
  return books.reduce(
    (acc, book) => ({ ...acc, [book.ltid]: book }),
    {} as BooksByLtid,
  )
}

export default function* staticApi({ search }: Lume.Data) {
  const previousBooks = search.pages('previous')
    .map((page) => ({
      title: page.title!,
      author: page.author,
      scheduledDate: page.date,
      ltid: page.ltid,
      tags: page.tags,
      url: site.url(page.url),
    }))
  const previousBooksByLtid = byLtId(previousBooks)
  yield {
    url: '/static-api/previous.json',
    contentType: 'application/json',
    content: JSON.stringify(previousBooksByLtid),
  }
  const upcomingBooks = search.pages('upcoming')
    .map((page) => ({
      title: page.title!,
      author: page.author,
      scheduledDate: page.scheduled ? page.date : undefined,
      ltid: page.ltid,
      tags: page.tags,
      url: site.url(page.url, true),
    }))
  const upcomingBooksByLtid = byLtId(upcomingBooks)
  yield {
    url: '/static-api/upcoming.json',
    contentType: 'application/json',
    content: JSON.stringify(upcomingBooksByLtid),
  }
  const ballotBooks = search.pages('ballot')
    .map((page) => ({
      title: page.title!,
      author: page.author,
      ltid: page.ltid,
      tags: page.tags,
      url: site.url(page.url, true),
    }))
  const ballotBooksByLtid = byLtId(ballotBooks)
  yield {
    url: '/static-api/ballot.json',
    contentType: 'application/json',
    content: JSON.stringify(ballotBooksByLtid),
  }

  for (const tag of Object.keys(genreTags)) {
    const tagBooks = search.pages(tag)
      .map((page) => ({
        title: page.title!,
        author: page.author,
        ltid: page.ltid,
        tags: page.tags,
        url: site.url(page.url, true),
      }))
    const tagBooksByLtid = byLtId(tagBooks)
    yield {
      url: `/static-api/tags/${tag}.json`,
      contentType: 'application/json',
      content: JSON.stringify(tagBooksByLtid),
    }
  }
}
