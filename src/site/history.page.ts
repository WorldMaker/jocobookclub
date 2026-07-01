import { getRecentWindowDescription } from '@worldmaker/jocobookclub-api/models'
import site from './_config.ts'
import { getHistory } from './history.data.ts'

export default async function* history() {
  const { booksByLtId: books, calendar, rankings, bookRanks, totalBooks } =
    await getHistory(site)

  //#region Calendar Pages
  const currentYear = Temporal.Now.plainDateISO().year
  const currentYearCalendar = calendar.get(currentYear) ?? new Map()
  calendar.delete(currentYear)
  const pastYears = [...calendar.keys()].sort()
  yield {
    layout: 'calendar.vto',
    title: 'Calendar',
    url: '/history/',
    year: currentYear,
    calendar: currentYearCalendar,
    pastYears,
    tags: ['history'],
  }

  for (const [year, yearCalendar] of calendar.entries()) {
    const title = year < currentYear
      ? `Club History — ${year}`
      : `Upcoming Club Events — ${year}`
    yield {
      layout: 'calendar.vto',
      title,
      url: `/history/${year}/`,
      year,
      calendar: yearCalendar,
      pastYears,
      tags: ['history'],
    }
  }
  //#endregion
}
