import { EligibleBooks } from '../models/tally.ts'

const staticApiUrl = 'https://worldmaker.net/jocobookclub/static-api'

export async function getBallotEligibleBooks(): Promise<EligibleBooks> {
  const response = await fetch(`${staticApiUrl}/ballot.json`)
  if (!response.ok) {
    throw new Error('Failed to fetch ballot')
  }
  const ballot = await response.json()
  return Object.keys(ballot) as EligibleBooks
}
