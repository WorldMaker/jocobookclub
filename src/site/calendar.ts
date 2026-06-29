import ICAL from 'ical.js'
import cruises from './_data/cruises.json' with { type: 'json' }
import { YearCalendar } from './history.model.ts'

export function createCalendarFileContents(calendar: YearCalendar) {
  const cal = new ICAL.Component(['vcalendar', [], []])
  cal.updatePropertyWithValue('prodid', '-//JoCo Book Club//iCal.js//EN')
  cal.updatePropertyWithValue('version', '2.0')
  const now = ICAL.Time.fromJSDate(new Date(), true)
  for (const [_year, monthCalendar] of calendar.entries()) {
    for (const [_month, dayCalendar] of monthCalendar.entries()) {
      for (const [_day, entries] of dayCalendar.entries()) {
        for (const entry of entries) {
          switch (entry.type) {
            case 'previous':
              {
                const vevent = new ICAL.Component('vevent')
                const event = new ICAL.Event(vevent)
                event.summary =
                  `JoCo Book Club Discussed: "${entry.title}" by ${entry.author}`
                event.uid = `book-${entry.ltid}`
                event.startDate = ICAL.Time.fromDateString(
                  entry.date.toString(),
                )
                event.description =
                  `JoCo Book Club Discussed: "${entry.title}" by ${entry.author}\n\nTags: ${
                    entry.tags.join(', ')
                  }\n\nURL: ${entry.url}`
                vevent.updatePropertyWithValue('dtstamp', now)
                cal.addSubcomponent(vevent)
              }
              break
            case 'upcoming':
              {
                const vevent = new ICAL.Component('vevent')
                const event = new ICAL.Event(vevent)
                event.summary =
                  `JoCo Book Club Meeting: "${entry.title}" by ${entry.author}`
                event.uid = `book-${entry.ltid}`
                const startDateTime = new Date(
                  entry.date.toPlainDateTime(entry.time).toZonedDateTime(
                    entry.timezone,
                  ).epochMilliseconds,
                )
                event.startDate = ICAL.Time.fromJSDate(startDateTime, true)
                event.duration = ICAL.Duration.fromSeconds(2 * 60 * 60) // 2 hours
                event.description =
                  `JoCo Book Club Meeting: "${entry.title}" by ${entry.author}\n\nTags: ${
                    entry.tags.join(', ')
                  }\n\nURL: ${entry.url}`
                vevent.updatePropertyWithValue('dtstamp', now)
                cal.addSubcomponent(vevent)
              }
              break
          }
        }
      }
    }
  }
  for (
    const [startStr, endStr, name] of cruises as [string, string, string][]
  ) {
    const vevent = new ICAL.Component('vevent')
    const event = new ICAL.Event(vevent)
    event.summary = name
    event.uid = `cruise-${startStr}`
    event.startDate = ICAL.Time.fromDateString(startStr)
    // ical.js treats end dates as exclusive, but cruises are inclusive, so add one day to make it work
    const endDate = Temporal.PlainDate.from(endStr).add({ days: 1 })
    event.endDate = ICAL.Time.fromDateString(endDate.toString())
    vevent.updatePropertyWithValue('dtstamp', now)
    cal.addSubcomponent(vevent)
  }
  return cal.toString()
}
