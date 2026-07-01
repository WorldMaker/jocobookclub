import { FinalTally } from '@worldmaker/jocobookclub-api/models'
import Site from 'lume/core/site.ts'
import cruises from './_data/cruises.json' with { type: 'json' }
import { BookDayRank, BookEntry, BooksByLtId, CalendarEntry, History, PreviousBookEntry, RankingEntry, ScheduledUpcomingBookEntry, YearCalendar } from './history.model.ts'

let history: History | null = null

function toPlainDate(date: Date): Temporal.PlainDate {
  // Lume dates are always in UTC
  return date.toTemporalInstant().toZonedDateTimeISO('UTC').toPlainDate()
}

export async function getHistory(site: Site): Promise<History> {
  if (history) {
    return history
  }

  const { search } = site

  const calendar: YearCalendar = new Map()
  const books: BooksByLtId = new Map()
  const bookRanks: BookDayRank = new Map()
  const totalBooks: Record<string, number> = {}

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

  //#region Previous Books
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
  //#endregion

  //#region Upcoming Books
  const upcomingBooks = search.pages('upcoming')
  for (const page of upcomingBooks) {
    const book: BookEntry = {
      type: 'upcoming',
      title: page.title!,
      author: page.author!,
      date: page.scheduled ? toPlainDate(page.date!) : undefined,
      time: page.scheduled ? Temporal.PlainTime.from(page.time!) : undefined,
      timezone: page.scheduled ? page.timezone! : undefined,
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
  //#endregion

  //#region Ballot Books
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
  //#endregion

  //#region Held Books
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
  //#endregion

  //#region Rankings
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

    const tally = FinalTally.safeParse(
      JSON.parse(await Deno.readTextFile(filename)),
    )
    if (!tally.success) {
      continue
    }
    const data = tally.data
    totalBooks[date.toString()] = data.ranking.length
    // rankings are in reverse order
    const rankingByLtId: Record<string, number> = {}
    for (let i = data.ranking.length - 1; i >= 0; i--) {
      const ltid = data.ranking[i]
      rankingByLtId[ltid] = data.ranking.length - i
      addToBookRanks(ltid, date, data.ranking.length - i)
    }

    const ranking: CalendarEntry = {
      type: 'ranking',
      date,
      filename,
      path,
      url: site.url(path, true),
      tally: data,
      byLtId: rankingByLtId,
    }
    rankings.push(ranking)
    addToCalendar(ranking)
  }
  rankings.sort((a, b) => Temporal.PlainDate.compare(a.date, b.date))
  for (let i = 1; i < rankings.length; i++) {
    rankings[i].lastEntry = rankings[i - 1]
  }
  const lastRanking = rankings.at(-1)!
  //#endregion

  history = {
    booksByLtId: books,
    calendar,
    rankings,
    bookRanks,
    totalBooks,
    lastRanking,
  }

  return history!
}
