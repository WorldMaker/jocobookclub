import {
  TallyBookMarks,
} from '@worldmaker/jocobookclub-api/models'

export type BookType = 'previous' | 'upcoming' | 'ballot' | 'held'
export interface BookEntry {
  type: BookType
  title: string
  author: string
  date?: Temporal.PlainDate
  time?: Temporal.PlainTime
  timezone?: string
  ltid: string
  tags: string[]
  url: string
}
export interface PreviousBookEntry extends BookEntry {
  type: 'previous'
  date: Temporal.PlainDate
}
export interface ScheduledUpcomingBookEntry extends BookEntry {
  type: 'upcoming'
  date: Temporal.PlainDate
  time: Temporal.PlainTime
  timezone: string
}

export type BooksByLtId = Map<string, BookEntry>

export interface RankingEntry {
  type: 'ranking'
  date: Temporal.PlainDate
  filename: string
  path: string
  url: string
}

export interface CruiseEntry {
  type: 'cruise'
  date: Temporal.PlainDate
  name: string
}

export type CalendarEntry =
  | PreviousBookEntry
  | ScheduledUpcomingBookEntry
  | RankingEntry
  | CruiseEntry

export type DayCalendary = Map<number, CalendarEntry[]>
export type MonthCalendar = Map<number, DayCalendary>
export type YearCalendar = Map<number, MonthCalendar>

export type DayRank = Record<string, number>
export type BookDayRank = Map<string, DayRank>

export interface LastRankingData {
  url: string | null
  byLtId: Record<string, number>
  date: Temporal.PlainDate
  books: string[]
  marks: TallyBookMarks[]
  supports: number[]
  count: number
}
