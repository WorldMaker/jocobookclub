import {
  FinalTally,
  getRecentWindowDescription,
  Mark,
  TallyBookMarks,
} from '@worldmaker/jocobookclub-api/models'
import cruises from './_data/cruises.json' with { type: 'json' }
import rawMarks from './_data/genre/marks.json' with { type: 'json' }
import site from './_config.ts'

type BookType = 'previous' | 'upcoming' | 'ballot' | 'held'
type BookEntry = {
  type: BookType
  title: string
  author: string
  date?: Temporal.PlainDate
  ltid: string
  tags: string[]
  url: string
}
type PreviousBookEntry = BookEntry & {
  type: 'previous'
  date: Temporal.PlainDate
}
type ScheduledUpcomingBookEntry = BookEntry & {
  type: 'upcoming'
  date: Temporal.PlainDate
}

type BooksByLtId = Map<string, BookEntry>

type RankingEntry = {
  type: 'ranking'
  date: Temporal.PlainDate
  filename: string
  path: string
  url: string
}

type CruiseEntry = {
  type: 'cruise'
  date: Temporal.PlainDate
  name: string
}

type CalendarEntry =
  | PreviousBookEntry
  | ScheduledUpcomingBookEntry
  | RankingEntry
  | CruiseEntry

type DayCalendary = Map<number, CalendarEntry[]>
type MonthCalendar = Map<number, DayCalendary>
type YearCalendar = Map<number, MonthCalendar>

type DayRank = Record<string, number>
type BookDayRank = Map<string, DayRank>

function toPlainDate(date: Date): Temporal.PlainDate {
  // Lume dates are always in UTC
  return date.toTemporalInstant().toZonedDateTimeISO('UTC').toPlainDate()
}

export default async function* history({ search }: Lume.Data) {
  const calendar: YearCalendar = new Map()
  const books: BooksByLtId = new Map()
  const bookRanks: BookDayRank = new Map()

  //#region Utitlity Functions
  const addToCalendar = (book: CalendarEntry) => {
    if (!book.date) {
      return
    }
    const { year, month, day } = book.date
    if (!calendar.has(year)) {
      calendar.set(year, new Map())
    }
    const monthCalendar = calendar.get(year)!
    if (!monthCalendar.has(month)) {
      monthCalendar.set(month, new Map())
    }
    const dayCalendar = monthCalendar.get(month)!
    if (!dayCalendar.has(day)) {
      dayCalendar.set(day, [])
    }
    dayCalendar.get(day)!.push(book)
  }

  const addToBookRanks = (
    ltid: string,
    date: Temporal.PlainDate,
    rank: number,
  ) => {
    if (!bookRanks.has(ltid)) {
      bookRanks.set(ltid, {})
    }
    bookRanks.get(ltid)![date.toString()] = rank
  }
  //#endregion

  //#region Cruises
  for (
    const [startStr, endStr, name] of cruises as [string, string, string][]
  ) {
    const startDate = Temporal.PlainDate.from(startStr)
    const endDate = Temporal.PlainDate.from(endStr)
    for (
      let date = startDate;
      Temporal.PlainDate.compare(date, endDate) <= 0;
      date = date.add({ days: 1 })
    ) {
      addToCalendar({
        type: 'cruise',
        date,
        name,
      })
    }
  }
  //#endregion

  //#region Calendar Prep
  const previousBooks = search.pages('previous')
  for (const page of previousBooks) {
    const book: PreviousBookEntry = {
      type: 'previous',
      title: page.title!,
      author: page.author!,
      date: toPlainDate(page.date!),
      ltid: page.ltid!,
      tags: page.tags!,
      url: site.url(page.url!, true),
    }
    books.set(book.ltid, book)
    addToCalendar(book)
    addToBookRanks(book.ltid, book.date, 0)
  }

  const upcomingBooks = search.pages('upcoming')
  for (const page of upcomingBooks) {
    const book: BookEntry = {
      type: 'upcoming',
      title: page.title!,
      author: page.author!,
      date: page.scheduled ? toPlainDate(page.date!) : undefined,
      ltid: page.ltid!,
      tags: page.tags!,
      url: site.url(page.url!, true),
    }
    books.set(book.ltid, book)
    if (book.date) {
      addToCalendar(book as ScheduledUpcomingBookEntry)
      addToBookRanks(book.ltid, book.date, 0)
    }
  }

  const ballotBooks = search.pages('ballot')
  for (const page of ballotBooks) {
    const book: BookEntry = {
      type: 'ballot',
      title: page.title!,
      author: page.author!,
      ltid: page.ltid!,
      tags: page.tags!,
      url: site.url(page.url!, true),
    }
    books.set(book.ltid, book)
  }

  const heldBooks = search.pages('held')
  for (const page of heldBooks) {
    const book: BookEntry = {
      type: 'held',
      title: page.title!,
      author: page.author!,
      ltid: page.ltid!,
      tags: page.tags!,
      url: site.url(page.url!, true),
    }
    books.set(book.ltid, book)
  }

  const rankings: RankingEntry[] = []
  for await (const entry of Deno.readDir('./_vote-history')) {
    const filename = `./_vote-history/${entry.name}`
    const historyMatch = entry.name.match(/(\d{4}-\d{2}-\d{2}).*\.json$/)
    if (!historyMatch) {
      continue
    }
    const date = Temporal.PlainDate.from(historyMatch[1])
    const path = `/ranking/${date.year}/${
      date.month.toString().padStart(2, '0')
    }/${date.day.toString().padStart(2, '0')}/`
    const ranking: CalendarEntry = {
      type: 'ranking',
      date,
      filename,
      path,
      url: site.url(path, true),
    }
    rankings.push(ranking)
    addToCalendar(ranking)
  }
  //#endregion

  //#region Calendar Pages
  const currentYear = Temporal.Now.plainDateISO().year
  const currentYearCalendar = calendar.get(currentYear) ?? new Map()
  calendar.delete(currentYear)
  const pastYears = [...calendar.keys()].sort()
  yield {
    layout: 'calendar.vto',
    title: 'Club History',
    url: '/history/',
    year: currentYear,
    calendar: currentYearCalendar,
    pastYears,
    tags: ['history'],
  }

  for (const [year, yearCalendar] of calendar.entries()) {
    yield {
      layout: 'calendar.vto',
      title: `Club History — ${year}`,
      url: `/history/${year}/`,
      year,
      calendar: yearCalendar,
      pastYears,
      tags: ['history'],
    }
  }
  //#endregion

  //#region Rankings
  rankings.sort((a, b) => Temporal.PlainDate.compare(a.date, b.date))

  const totalBooks: DayRank = {}
  let lastRankingDate: Temporal.PlainDate | null = null
  let lastRankingUrl: string | null = null
  let lastRankingByLtId: Record<string, number> = {}
  let lastBooks: string[] = []
  let lastMarks: TallyBookMarks[] = []
  let lastSupports: number[] = []
  let lastCount = 0
  for (const ranking of rankings) {
    const tally = FinalTally.safeParse(
      JSON.parse(await Deno.readTextFile(ranking.filename)),
    )
    if (!tally.success) {
      continue
    }
    const data = tally.data
    totalBooks[ranking.date.toString()] = data.ranking.length
    // rankings are in reverse order
    const rankingByLtId: Record<string, number> = {}
    for (let i = data.ranking.length - 1; i >= 0; i--) {
      const ltid = data.ranking[i]
      rankingByLtId[ltid] = data.ranking.length - i
      addToBookRanks(ltid, ranking.date, data.ranking.length - i)
    }
    yield {
      ...data,
      layout: 'ranking.vto',
      title: `Ranking — ${ranking.date.toLocaleString()}`,
      url: ranking.path,
      booksByLtId: books,
      rankingDate: ranking.date,
      lastRankingUrl,
      lastRankingByLtId,
      recentWindowDescription: getRecentWindowDescription(data.recentWindow),
      tags: ['history'],
    }
    lastRankingUrl = site.url(ranking.path, true)
    lastRankingByLtId = rankingByLtId
    lastRankingDate = ranking.date
    lastBooks = data.books
    lastMarks = data.marks ?? []
    lastSupports = data.supports ?? []
    lastCount = data.count
  }

  for (const [ltid, book] of bookRanks.entries()) {
    yield {
      url: `/static-api/book-ranks/${ltid}.json`,
      contentType: 'application/json',
      content: JSON.stringify(book),
    }
  }

  yield {
    url: `/static-api/total-books.json`,
    contentType: 'application/json',
    content: JSON.stringify(totalBooks),
  }
  //#endregion

  //#region Marks
  const twoMonthsAgo = Temporal.Now.zonedDateTimeISO().subtract({ months: 2 })

  for (const [mark, info] of Object.entries(rawMarks)) {
    const recentMarksByUser: Record<string, [string, Date]> = {}
    const allMarks: Record<string, [string, Date][]> = {}

    for (let i = 0; i < lastBooks.length; i++) {
      const ltid = lastBooks[i]
      if (!(ltid in allMarks)) {
        allMarks[ltid] = []
      }
      const bookMarks = lastMarks[i]?.[mark as Mark]
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
      lastRankingDate,
      lastRankingUrl,
      lastRankingByLtId,
      mark,
      books,
      recentMarks,
      allMarks,
    }
  }
  //#endregion

  //#region Index/Underdogs
  const sorted = lastSupports
    .map((support, index) => ({
      percentSupport: lastCount > 0 ? support / lastCount : 0,
      ltid: lastBooks[index],
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
  //#endregion
}
