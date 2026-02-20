import { FinalTally } from '@worldmaker/jocobookclub-api/models'
import site from './_config.ts'
import { contentType } from 'jsr:@std/media-types@^1.0.0-rc.1/content-type'

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
type PreviousBookEntry = BookEntry & { type: 'previous', date: Temporal.PlainDate }
type ScheduledUpcomingBookEntry = BookEntry & { type: 'upcoming', date: Temporal.PlainDate }

type BooksByLtId = Map<string, BookEntry>

type RankingEntry = {
  type: 'ranking'
  date: Temporal.PlainDate
  filename: string
  path: string
  url: string
}

type CalendarEntry =
  | PreviousBookEntry
  | ScheduledUpcomingBookEntry
  | RankingEntry

type DayCalendary = Map<number, CalendarEntry[]>
type MonthCalendar = Map<number, DayCalendary>
type YearCalendar = Map<number, MonthCalendar>

type DayRank = Record<string, number>
type BookDayRank = Map<string, DayRank>

function toPlainDate(date: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  })
}

export default async function* history({ search }: Lume.Data) {
  const calendar: YearCalendar = new Map()
  const books: BooksByLtId = new Map()
  const bookRanks: BookDayRank = new Map()

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

  const addToBookRanks = (ltid: string, date: Temporal.PlainDate, rank: number) => {
    if (!bookRanks.has(ltid)) {
      bookRanks.set(ltid, {})
    }
    bookRanks.get(ltid)![date.toString()] = rank
  }

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
    const path = `/ranking/${date.year}/${date.month.toString().padStart(2, '0')}/${date.day.toString().padStart(2, '0')}/`
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
  }

  for (const [year, yearCalendar] of calendar.entries()) {
    yield {
      layout: 'calendar.vto',
      title: `Club History — ${year}`,
      url: `/history/${year}/`,
      year,
      calendar: yearCalendar,
      pastYears,
    }
  }

  for (const ranking of rankings) {
    const tally = FinalTally.safeParse(JSON.parse(await Deno.readTextFile(ranking.filename)))
    if (!tally.success) {
      continue
    }
    const data = tally.data
    // rankings are in reverse order
    for (let i = data.ranking.length - 1; i >= 0; i--) {
      const ltid = data.ranking[i]
      addToBookRanks(ltid, ranking.date, data.ranking.length - i)
    }
    yield {
      ...data,
      layout: 'ranking.vto',
      title: `Ranking — ${ranking.date.toLocaleString()}`,
      url: ranking.path,
      books,
      rankingDate: ranking.date,
    }
  }

  for (const [ltid, book] of bookRanks.entries()) {
    yield {
      url: `/static-api/book-ranks/${ltid}.json`,
      contentType: 'application/json',
      content: JSON.stringify(book),
    }
  }
}
