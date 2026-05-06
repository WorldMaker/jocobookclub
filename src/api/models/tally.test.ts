import { expect } from '@std/expect'
import { describe, it } from '@std/testing/bdd'
import type { Ballot } from './ballot.ts'
import { addTally, getTallyFromBallot, zeroTally } from './tally.ts'
import type { Preferred } from './preferred.ts'

describe('tally', () => {
  const eligibleBooks = ['A', 'B', 'C', 'D', 'E']
  const emptyPreferred: Preferred = {
    multiplier: 1,
    userIds: new Set<string>(),
  }

  it('should return a zero tally for an inactive ballot', () => {
    const ballot: Ballot = {
      active: false,
      books: {
        A: 1,
        B: 2,
        C: 3,
        D: 4,
        E: 5,
      },
      updated: new Date(),
      userId: 'user1',
    }
    const tally = getTallyFromBallot(eligibleBooks, ballot, emptyPreferred)
    const zero = zeroTally(eligibleBooks, emptyPreferred)
    expect(tally).toMatchObject(zero)
  })

  it('should calculate supports from a simple, extreme ballot', () => {
    const ballot: Ballot = {
      active: true,
      books: {
        D: 5,
      },
      updated: new Date(),
      userId: 'user1',
    }
    const tally = getTallyFromBallot(eligibleBooks, ballot, emptyPreferred)
    expect(tally.supports).toEqual([0, 0, 0, 1, 0])
  })

  it('should calculate supports from a simple, extreme ballot with preferred multiplier', () => {
    const ballot: Ballot = {
      active: true,
      books: {
        D: 5,
      },
      updated: new Date(),
      userId: 'user1',
    }
    const preferred: Preferred = {
      multiplier: 3,
      userIds: new Set(['user1']),
    }
    const tally = getTallyFromBallot(eligibleBooks, ballot, preferred)
    expect(tally.count).toEqual(3)
    expect(tally.supports).toEqual([0, 0, 0, 3, 0])
  })

  it('should recognize a meh ballot', () => {
    const ballot: Ballot = {
      active: true,
      books: {
        A: 3,
        B: 3,
        C: 3,
        D: 3,
        E: 3,
      },
      updated: new Date(),
      userId: 'user1',
    }
    const tally = getTallyFromBallot(eligibleBooks, ballot, emptyPreferred)
    expect(tally.mehCount).toEqual(1)
  })

  it('should calculate marks from a ballot', () => {
    const markDate = new Date()
    const ballot: Ballot = {
      active: true,
      books: {
        A: { vote: 1, mark: ['otter', markDate] },
        B: { vote: 2, mark: ['raccoon', markDate] },
        C: 3,
        D: 4,
        E: 5,
      },
      updated: new Date(),
      userId: 'user1',
    }
    const tally = getTallyFromBallot(eligibleBooks, ballot, emptyPreferred)
    expect(tally.marks[0]['otter']!['user1']).toEqual(markDate)
    expect(tally.marks[1]['raccoon']!['user1']).toEqual(markDate)
    expect(tally.marks[2]).toEqual({})
  })

  it('should accumulate marks', () => {
    const markDate1 = new Date()
    const markDate2 = new Date()
    const tally1 = zeroTally(eligibleBooks, emptyPreferred)
    tally1.count = 1
    tally1.marks[0] = {
      otter: { user1: markDate1 },
    }
    const tally2 = zeroTally(eligibleBooks, emptyPreferred)
    tally2.count = 1
    tally2.marks[0] = {
      raccoon: { user2: markDate2 },
    }
    const combinedTally = addTally(tally1, tally2, emptyPreferred)
    expect(combinedTally.marks[0]).toEqual({
      otter: { user1: markDate1 },
      raccoon: { user2: markDate2 },
    })
  })
})
