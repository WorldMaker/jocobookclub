import { expect } from '@std/expect'
import { describe, it } from '@std/testing/bdd'
import type { Ballot } from './ballot.ts'
import { getTallyFromBallot, zeroTally } from './tally.ts'
import type { Preferred } from './preferred.ts'

describe('tally', () => {
  const eligibleBooks = ['A', 'B', 'C', 'D', 'E']
  const emptyPreferred: Preferred = { multiplier: 1, userIds: new Set<string>() }

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
    const zero = zeroTally(eligibleBooks)
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
})