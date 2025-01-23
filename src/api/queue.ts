import { getBallotEligibleBooks } from './clients/static-api.ts'
import {
  addTally,
  buckets,
  getBucketForUser,
  tallyBucket,
  tallyFinal,
  tallyFinalRanking,
  zeroTally,
} from './models/tally.ts'
import { QueueMessages, queueTallied } from './models/voting.ts'

export async function listenQueue(kv: Deno.Kv, msg: unknown) {
  const qmessage = QueueMessages.safeParse(msg)
  if (!qmessage.success) {
    return
  }

  switch (qmessage.data.type) {
    case 'bucket-tallied':
      {
        const books = await getBallotEligibleBooks()
        const time = await kv.get<Date>(['final-tally-time'])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        const finalTally = await tallyFinalRanking(kv, books)
        await kv.atomic()
          .check(time)
          .set(['final-tally-time'], qmessage.data.at)
          .set(['final-tally'], finalTally)
          .commit()
      }
      break
    case 'recount-requested':
      {
        const books = await getBallotEligibleBooks()
        const time = await kv.get<Date>(['final-tally-time'])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        let combinedTally = zeroTally(books)
        // TODO: Divide and conquer?
        for (const bucket of buckets) {
          const tally = await tallyBucket(kv, bucket, books)
          await kv.set(['tally', bucket], tally)
          combinedTally = addTally(combinedTally, tally)
        }
        await kv.atomic()
          .check(time)
          .set(['final-tally-time'], new Date())
          .set(['final-tally'], tallyFinal(combinedTally))
          .commit()
      }
      break
    case 'user-voted':
      {
        const books = await getBallotEligibleBooks()
        const bucket = getBucketForUser(qmessage.data.userId)
        if (!bucket) {
          return
        }
        const time = await kv.get<Date>(['tally-time', bucket])
        if (time.value && time.value >= qmessage.data.at) {
          return
        }
        const tally = await tallyBucket(kv, bucket, books)
        await kv.atomic()
          .check(time)
          .set(['tally-time', bucket], qmessage.data.at)
          .set(['tally', bucket], tally)
          .commit()
        await queueTallied(kv, bucket)
      }
      break
  }
}
